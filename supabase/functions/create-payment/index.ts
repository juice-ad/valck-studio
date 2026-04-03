import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createPaymentLink } from "../_shared/mollie.ts";

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

    // Parse request
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "invoiceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoice with client info (use service role for unrestricted access)
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: invoice, error: invoiceError } = await serviceSupabase
      .from("invoices")
      .select("*, clients(company_name, email)")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't create payment link if already paid
    if (invoice.status === "betaald") {
      return new Response(
        JSON.stringify({ error: "Invoice is already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format amount from cents to "XX.XX"
    const amountValue = (invoice.amount_cents / 100).toFixed(2);

    // Create Mollie payment link
    const siteUrl = Deno.env.get("SITE_URL") || "https://valckstudio.nl";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const paymentLink = await createPaymentLink({
      description: `Factuur ${invoice.number} — ${invoice.clients?.company_name ?? "Valck Studio"}`,
      amount: { currency: "EUR", value: amountValue },
      redirectUrl: `${siteUrl}/portal/facturen?payment=complete`,
      webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook`,
    });

    // Update invoice with payment link info
    await serviceSupabase
      .from("invoices")
      .update({
        mollie_payment_link_id: paymentLink.id,
        mollie_payment_link_url: paymentLink._links.paymentLink.href,
        status: invoice.status === "concept" ? "verstuurd" : invoice.status,
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    return new Response(
      JSON.stringify({
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink._links.paymentLink.href,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-payment error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
