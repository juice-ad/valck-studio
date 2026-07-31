import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  syncClientToMoneybird,
  createSalesInvoice,
  sendSalesInvoice,
  getTaxRateId,
  getLedgerId,
} from "../_shared/moneybird.ts";
import { createPaymentLink } from "../_shared/mollie.ts";

interface LineItem {
  description: string;
  quantity: number;
  priceCents: number;
}

interface CreateInvoiceRequest {
  clientId: string;
  items: LineItem[];
  dueDate?: string;
  reference?: string;
  sendEmail?: boolean;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request
    const body: CreateInvoiceRequest = await req.json();
    const { clientId, items, reference, sendEmail = true } = body;

    if (!clientId || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "clientId and at least one item are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Sync client to Moneybird
    const moneybirdContactId = await syncClientToMoneybird(clientId);

    // 2. Generate invoice number: VS-{year}-{sequence}
    const year = new Date().getFullYear();
    const { count } = await serviceSupabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .like("number", `VS-${year}-%`);

    const sequence = (count ?? 0) + 1;
    const invoiceNumber = `VS-${year}-${String(sequence).padStart(3, "0")}`;

    // 3. Calculate total in cents
    const totalCents = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0
    );

    // 4. Due date: provided or +30 days
    const dueDate = body.dueDate
      ? body.dueDate
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

    // 5. Create sales invoice in Moneybird
    const taxRateId = getTaxRateId();
    const ledgerId = getLedgerId();

    const moneybirdInvoice = await createSalesInvoice({
      contact_id: moneybirdContactId,
      reference: invoiceNumber,
      due_date: dueDate,
      details_attributes: items.map((item) => ({
        description: item.description,
        price: (item.priceCents / 100).toFixed(2),
        amount: String(item.quantity),
        tax_rate_id: taxRateId,
        ledger_account_id: ledgerId,
      })),
    });

    // 6. Send invoice via Moneybird email
    if (sendEmail) {
      await sendSalesInvoice(moneybirdInvoice.id);
    }

    // 7. Create Mollie payment link
    // Use the total incl. tax from Moneybird (includes 21% BTW)
    const totalInclTax = moneybirdInvoice.total_price_incl_tax;

    // Fetch client for company name
    const { data: client } = await serviceSupabase
      .from("clients")
      .select("company_name")
      .eq("id", clientId)
      .single();

    const siteUrl = Deno.env.get("SITE_URL") || "https://valckstudio.nl";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const paymentLink = await createPaymentLink({
      description: `Factuur ${invoiceNumber} — ${client?.company_name ?? "Valck Studio"}`,
      amount: { currency: "EUR", value: totalInclTax },
      redirectUrl: `${siteUrl}/portal/facturen?payment=complete`,
      webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook`,
    });

    // 8. Store everything in Valck DB
    const lineItemsJson = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      price_cents: item.priceCents,
    }));

    // Amount in DB is total incl. tax in cents
    const amountCentsInclTax = Math.round(parseFloat(totalInclTax) * 100);

    const { data: invoice, error: insertError } = await serviceSupabase
      .from("invoices")
      .insert({
        number: invoiceNumber,
        description: reference || items[0]?.description || null,
        amount_cents: amountCentsInclTax,
        client_id: clientId,
        status: sendEmail ? "verstuurd" : "concept",
        due_date: dueDate,
        sent_at: sendEmail ? new Date().toISOString() : null,
        line_items: lineItemsJson,
        moneybird_invoice_id: moneybirdInvoice.id,
        moneybird_contact_id: moneybirdContactId,
        mollie_payment_link_id: paymentLink.id,
        mollie_payment_link_url: paymentLink._links.paymentLink.href,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        invoiceId: invoice.id,
        number: invoiceNumber,
        paymentLinkUrl: paymentLink._links.paymentLink.href,
        moneybirdInvoiceId: moneybirdInvoice.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-full-invoice error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
