/**
 * Edge Function: notify-ticket-update
 *
 * Sends email notifications via Resend when a ticket status changes
 * or when a studio reply is added. Also creates an in-app notification record.
 *
 * Secrets required:
 * - RESEND_API_KEY
 * - SUPABASE_URL (auto-set)
 * - SUPABASE_SERVICE_ROLE_KEY (auto-set)
 *
 * Called from admin UI after status change or reply.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface NotifyPayload {
  ticketId: string;
  type: "status_change" | "reply";
  newStatus?: string;
  replyPreview?: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  opgelost: "Opgelost",
  gesloten: "Gesloten",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify admin JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Verify the caller is admin
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: NotifyPayload = await req.json();
    const { ticketId, type, newStatus, replyPreview } = payload;

    if (!ticketId || !type) {
      return new Response(
        JSON.stringify({ error: "ticketId and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch ticket with client info
    const { data: ticket, error: ticketError } = await supabaseAuth
      .from("tickets")
      .select("id, subject, status, client_id, created_by")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the creator's email
    const { data: creator } = await supabaseAuth
      .from("profiles")
      .select("email, full_name")
      .eq("id", ticket.created_by)
      .single();

    if (!creator?.email) {
      return new Response(
        JSON.stringify({ error: "Could not find ticket creator email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification content
    let subject: string;
    let body: string;

    if (type === "status_change" && newStatus) {
      subject = `Ticket "${ticket.subject}" — status gewijzigd naar ${STATUS_LABELS[newStatus] || newStatus}`;
      body = `<p>Hoi ${creator.full_name || ""},</p>
<p>De status van je ticket "<strong>${ticket.subject}</strong>" is gewijzigd naar <strong>${STATUS_LABELS[newStatus] || newStatus}</strong>.</p>
<p>Je kunt je ticket bekijken in het portaal.</p>
<br/>
<p style="color:#888;font-size:12px;">— Valck Studio</p>`;
    } else {
      subject = `Nieuw antwoord op ticket "${ticket.subject}"`;
      body = `<p>Hoi ${creator.full_name || ""},</p>
<p>Er is een nieuw antwoord op je ticket "<strong>${ticket.subject}</strong>".</p>
${replyPreview ? `<blockquote style="border-left:3px solid #e5e5e5;padding-left:12px;color:#555;margin:16px 0;">${replyPreview.slice(0, 200)}${replyPreview.length > 200 ? "..." : ""}</blockquote>` : ""}
<p>Bekijk het volledige antwoord in het portaal.</p>
<br/>
<p style="color:#888;font-size:12px;">— Valck Studio</p>`;
    }

    // Send email via Resend (if configured)
    let emailSent = false;
    if (resendApiKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Valck Studio <noreply@valckstudio.nl>",
          to: [creator.email],
          subject,
          html: body,
        }),
      });
      emailSent = emailRes.ok;
    }

    // Create in-app notification
    await supabaseAuth.from("notifications").insert({
      user_id: ticket.created_by,
      type: type === "status_change" ? "ticket_status" : "ticket_reply",
      title: subject,
      body: type === "status_change"
        ? `Status gewijzigd naar ${STATUS_LABELS[newStatus || ""] || newStatus}`
        : replyPreview?.slice(0, 100) || "Nieuw antwoord",
      link: `/portal/tickets/${ticketId}`,
    });

    return new Response(
      JSON.stringify({ success: true, emailSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
