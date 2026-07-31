/**
 * Shared Moneybird API client for Edge Functions.
 *
 * Secrets stored as Supabase Edge Function secrets:
 * - MONEYBIRD_TOKEN (Personal Access Token)
 * - MONEYBIRD_ADMIN_ID (Administration ID)
 * - MONEYBIRD_TAX_RATE_ID (BTW 21% tarief ID)
 * - MONEYBIRD_LEDGER_ID (Grootboekrekening ID voor omzet)
 *
 * NEVER expose these in frontend code.
 */

// --- Configuration ---

function getToken(): string {
  const token = Deno.env.get("MONEYBIRD_TOKEN");
  if (!token) throw new Error("MONEYBIRD_TOKEN secret not configured");
  return token;
}

function getAdminId(): string {
  const id = Deno.env.get("MONEYBIRD_ADMIN_ID");
  if (!id) throw new Error("MONEYBIRD_ADMIN_ID secret not configured");
  return id;
}

function getBaseUrl(): string {
  return `https://moneybird.com/api/v2/${getAdminId()}`;
}

export function getTaxRateId(): string {
  const id = Deno.env.get("MONEYBIRD_TAX_RATE_ID");
  if (!id) throw new Error("MONEYBIRD_TAX_RATE_ID secret not configured");
  return id;
}

export function getLedgerId(): string {
  const id = Deno.env.get("MONEYBIRD_LEDGER_ID");
  if (!id) throw new Error("MONEYBIRD_LEDGER_ID secret not configured");
  return id;
}

// --- Interfaces ---

export interface MoneybirdContact {
  id: string;
  company_name: string;
  customer_id: string;
  email: string;
  tax_number: string | null;
  chamber_of_commerce: string | null;
}

export interface MoneybirdInvoiceDetail {
  description: string;
  price: string; // "XX.XX" per unit
  amount: string; // quantity as string
  tax_rate_id: string;
  ledger_account_id: string;
}

export interface MoneybirdSalesInvoice {
  id: string;
  invoice_id: string; // human-readable number
  contact_id: string;
  reference: string;
  total_price_incl_tax: string;
  total_price_excl_tax: string;
  due_date: string;
  state: string;
  details: MoneybirdInvoiceDetail[];
}

export interface MoneybirdPayment {
  payment_date: string; // "YYYY-MM-DD"
  price: string; // "XX.XX"
  financial_account_id?: string;
}

export interface MoneybirdPdfResponse {
  download_url: string;
}

// --- Helper ---

async function moneybirdFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Moneybird API error: ${res.status} ${error}`);
  }

  return res.json();
}

// --- Contacts ---

export async function createContact(data: {
  company_name: string;
  customer_id: string;
  email: string;
  tax_number?: string;
  chamber_of_commerce?: string;
}): Promise<MoneybirdContact> {
  return moneybirdFetch<MoneybirdContact>("/contacts.json", {
    method: "POST",
    body: JSON.stringify({ contact: data }),
  });
}

export async function findContactByCustomerId(
  customerId: string
): Promise<MoneybirdContact | null> {
  const results = await moneybirdFetch<MoneybirdContact[]>(
    `/contacts.json?query=${encodeURIComponent(customerId)}`
  );

  return results.find((c) => c.customer_id === customerId) ?? null;
}

// --- Sales Invoices ---

export async function createSalesInvoice(data: {
  contact_id: string;
  reference: string;
  due_date: string;
  details_attributes: MoneybirdInvoiceDetail[];
}): Promise<MoneybirdSalesInvoice> {
  return moneybirdFetch<MoneybirdSalesInvoice>("/sales_invoices.json", {
    method: "POST",
    body: JSON.stringify({ sales_invoice: data }),
  });
}

export async function sendSalesInvoice(
  invoiceId: string,
  body: { delivery_method?: string } = {}
): Promise<MoneybirdSalesInvoice> {
  return moneybirdFetch<MoneybirdSalesInvoice>(
    `/sales_invoices/${invoiceId}/send_invoice.json`,
    {
      method: "PATCH",
      body: JSON.stringify({
        sales_invoice_sending: {
          delivery_method: body.delivery_method ?? "Email",
        },
      }),
    }
  );
}

// --- Payments ---

export async function registerPayment(
  invoiceId: string,
  data: MoneybirdPayment
): Promise<unknown> {
  return moneybirdFetch(`/sales_invoices/${invoiceId}/payments.json`, {
    method: "POST",
    body: JSON.stringify({ payment: data }),
  });
}

// --- PDF ---

export async function downloadInvoicePdf(
  invoiceId: string
): Promise<MoneybirdPdfResponse> {
  return moneybirdFetch<MoneybirdPdfResponse>(
    `/sales_invoices/${invoiceId}/download_pdf.json`
  );
}

// --- Client Sync Logic (shared between functions) ---

import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function syncClientToMoneybird(clientId: string): Promise<string> {
  const supabase = createSupabaseClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch client from DB
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  // Already synced
  if (client.moneybird_contact_id) {
    return client.moneybird_contact_id;
  }

  // Check Moneybird for existing contact (idempotency)
  const existing = await findContactByCustomerId(clientId);
  if (existing) {
    await supabase
      .from("clients")
      .update({ moneybird_contact_id: existing.id })
      .eq("id", clientId);
    return existing.id;
  }

  // Create new contact in Moneybird
  const contact = await createContact({
    company_name: client.company_name,
    customer_id: clientId,
    email: client.billing_email || client.email,
    tax_number: client.vat_number || undefined,
    chamber_of_commerce: client.kvk_number || undefined,
  });

  // Store Moneybird contact ID
  await supabase
    .from("clients")
    .update({ moneybird_contact_id: contact.id })
    .eq("id", clientId);

  return contact.id;
}
