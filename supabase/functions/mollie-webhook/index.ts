import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPayment } from "../_shared/mollie.ts";
import { registerPayment as registerMoneybirdPayment } from "../_shared/moneybird.ts";

/**
 * Mollie Webhook Handler
 *
 * Mollie sends a POST with `id=tr_xxxxx` when a payment status changes.
 * We MUST always return 200 OK — Mollie retries up to 10x over 26 hours otherwise.
 *
 * No auth header — Mollie calls this directly. We verify by fetching
 * the payment from Mollie's API (which requires our API key).
 */
Deno.serve(async (req) => {
  // Mollie always POSTs
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Mollie sends form-encoded body with `id` parameter
    const formData = await req.formData();
    const paymentId = formData.get("id") as string;

    if (!paymentId) {
      console.error("Webhook called without payment ID");
      return new Response("OK", { status: 200 });
    }

    // Fetch actual payment status from Mollie (this verifies authenticity)
    const payment = await getPayment(paymentId);

    // Use service role for DB operations (no user auth in webhooks)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find invoice by mollie_payment_id
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("mollie_payment_id", paymentId)
      .single();

    // Also check by payment link (payment might be linked via payment link)
    // Mollie payment links create payments with a reference
    let invoiceId = invoice?.id;

    if (!invoiceId) {
      // Try to match via description (format: "Factuur VS-2026-XXX — Company")
      // This is a fallback — primary match is via mollie_payment_id
      console.log(`No invoice found for payment ${paymentId}, checking payment link...`);

      // Store the payment ID for future reference
      // The create-payment function stores the payment link ID, not the payment ID
      // So we need to update when we first see a payment from a link
      const { data: linkInvoice } = await supabase
        .from("invoices")
        .select("id, status")
        .not("mollie_payment_link_id", "is", null)
        .is("mollie_payment_id", null)
        .limit(1);

      if (linkInvoice && linkInvoice.length > 0) {
        // Update with the actual payment ID
        invoiceId = linkInvoice[0].id;
        await supabase
          .from("invoices")
          .update({ mollie_payment_id: paymentId })
          .eq("id", invoiceId);
      }
    }

    if (!invoiceId) {
      console.log(`No matching invoice for payment ${paymentId}`);
      return new Response("OK", { status: 200 });
    }

    // Update invoice based on payment status
    if (payment.status === "paid") {
      await supabase
        .from("invoices")
        .update({
          status: "betaald",
          paid_at: payment.paidAt || new Date().toISOString(),
          payment_method: payment.method,
          mollie_payment_id: paymentId,
        })
        .eq("id", invoiceId);

      console.log(`Invoice ${invoiceId} marked as paid via ${payment.method}`);

      // Register payment in Moneybird (non-blocking — webhook must always return 200)
      try {
        const { data: fullInvoice } = await supabase
          .from("invoices")
          .select("moneybird_invoice_id, amount_cents")
          .eq("id", invoiceId)
          .single();

        if (fullInvoice?.moneybird_invoice_id) {
          const today = new Date().toISOString().split("T")[0];
          const amount = (fullInvoice.amount_cents / 100).toFixed(2);

          await registerMoneybirdPayment(fullInvoice.moneybird_invoice_id, {
            payment_date: today,
            price: amount,
          });

          console.log(`Moneybird payment registered for invoice ${invoiceId}`);
        }
      } catch (mbErr) {
        // Log but don't fail — Mollie webhook must always succeed
        console.error("Moneybird payment registration failed:", mbErr);
      }
    } else if (payment.status === "expired" || payment.status === "failed" || payment.status === "canceled") {
      // Only mark as vervallen if not already paid
      const { data: currentInvoice } = await supabase
        .from("invoices")
        .select("status")
        .eq("id", invoiceId)
        .single();

      if (currentInvoice?.status !== "betaald") {
        await supabase
          .from("invoices")
          .update({ status: "vervallen" })
          .eq("id", invoiceId);

        console.log(`Invoice ${invoiceId} marked as vervallen (${payment.status})`);
      }
    }

    // Always return 200 OK to Mollie
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    // Still return 200 to prevent Mollie retries for server errors
    return new Response("OK", { status: 200 });
  }
});
