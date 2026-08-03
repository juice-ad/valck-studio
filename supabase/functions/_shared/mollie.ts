/**
 * Shared Mollie API client for Edge Functions.
 *
 * API key is stored as a Supabase Edge Function secret: MOLLIE_API_KEY
 * NEVER expose this key in frontend code.
 */

const MOLLIE_API_BASE = "https://api.mollie.com/v2";

function getApiKey(): string {
  const key = Deno.env.get("MOLLIE_API_KEY");
  if (!key) throw new Error("MOLLIE_API_KEY secret not configured");
  return key;
}

interface MolliePaymentLinkRequest {
  description: string;
  amount: { currency: string; value: string };
  redirectUrl: string;
  webhookUrl: string;
}

interface MolliePaymentLink {
  id: string;
  _links: {
    paymentLink: { href: string };
  };
}

interface MolliePayment {
  id: string;
  status: "open" | "canceled" | "pending" | "authorized" | "expired" | "failed" | "paid";
  amount: { currency: string; value: string };
  description: string | null;
  method: string | null;
  paidAt: string | null;
  _links: {
    checkout?: { href: string };
  };
}

export async function createPaymentLink(
  params: MolliePaymentLinkRequest
): Promise<MolliePaymentLink> {
  const res = await fetch(`${MOLLIE_API_BASE}/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Mollie API error: ${res.status} ${error}`);
  }

  return res.json();
}

export async function getPayment(paymentId: string): Promise<MolliePayment> {
  const res = await fetch(`${MOLLIE_API_BASE}/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Mollie API error: ${res.status} ${error}`);
  }

  return res.json();
}
