import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { downloadInvoicePdf } from "../_shared/moneybird.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify JWT (RLS ensures clients only see own invoices)
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

    // Parse invoice ID from query params
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("invoiceId");
    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "invoiceId query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoice via user's supabase client (RLS filters by client)
    // Admin users can see all invoices, clients only their own
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let invoice;
    if (profile?.role === "admin") {
      // Admin: use service role to fetch any invoice
      const serviceSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await serviceSupabase
        .from("invoices")
        .select("id, number, moneybird_invoice_id")
        .eq("id", invoiceId)
        .single();
      invoice = data;
    } else {
      // Client: RLS ensures they only see own invoices
      const { data } = await supabase
        .from("invoices")
        .select("id, number, moneybird_invoice_id")
        .eq("id", invoiceId)
        .single();
      invoice = data;
    }

    if (!invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!invoice.moneybird_invoice_id) {
      return new Response(
        JSON.stringify({ error: "No Moneybird invoice linked — PDF not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch PDF download URL from Moneybird
    const pdfResponse = await downloadInvoicePdf(invoice.moneybird_invoice_id);

    // Fetch the actual PDF from the download URL
    const pdfRes = await fetch(pdfResponse.download_url);
    if (!pdfRes.ok) {
      throw new Error(`Failed to download PDF: ${pdfRes.status}`);
    }

    const pdfBuffer = await pdfRes.arrayBuffer();
    const filename = `Factuur-${invoice.number}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("get-invoice-pdf error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
