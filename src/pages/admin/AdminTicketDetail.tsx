import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket, TicketMessage, TicketStatus } from "@/types/portal";
import { Button } from "@/components/ui/button";

const statusFlow: TicketStatus[] = [
  "open",
  "in_behandeling",
  "opgelost",
  "gesloten",
];

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  opgelost: "Opgelost",
  gesloten: "Gesloten",
};

type TicketWithClient = Ticket & {
  client: { company_name: string } | null;
};

export function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketWithClient | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [ticketRes, messagesRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("*, client:clients(company_name)")
          .eq("id", id)
          .single(),
        supabase
          .from("ticket_messages")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (ticketRes.error) {
        toast.error("Ticket niet gevonden");
      } else {
        setTicket(ticketRes.data as TicketWithClient);
      }
      setMessages((messagesRes.data as TicketMessage[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id]);

  async function notifyClient(type: "status_change" | "reply", newStatus?: string, replyPreview?: string) {
    if (!ticket) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-ticket-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ ticketId: ticket.id, type, newStatus, replyPreview }),
        }
      );
    } catch {
      // Notification failure is non-blocking
    }
  }

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!ticket) return;

    const { error } = await supabase
      .from("tickets")
      .update({ status: newStatus })
      .eq("id", ticket.id);

    if (error) {
      toast.error("Fout bij status update");
    } else {
      setTicket({ ...ticket, status: newStatus });
      toast.success(`Status gewijzigd naar "${statusLabels[newStatus]}"`);
      notifyClient("status_change", newStatus);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !id || !user) return;

    setSending(true);
    const { data, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: id,
        sender_id: user.id,
        body: reply.trim(),
        is_from_studio: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Fout bij versturen");
    } else {
      setMessages([...messages, data as TicketMessage]);
      notifyClient("reply", undefined, reply.trim());
      setReply("");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Ticket niet gevonden.</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/tickets"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} />
        Terug naar tickets
      </Link>

      {/* Ticket info */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-xl font-bold text-text">{ticket.subject}</h1>
          <span className="text-xs text-text-muted shrink-0">
            {ticket.client?.company_name}
          </span>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
          {ticket.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Prioriteit: <strong className="capitalize">{ticket.priority}</strong></span>
          <span>&middot;</span>
          <span>
            Aangemaakt:{" "}
            {new Date(ticket.created_at).toLocaleDateString("nl-NL")}
          </span>
        </div>

        {/* Status controls */}
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="text-xs font-semibold text-text-muted uppercase mb-2">
            Status wijzigen
          </p>
          <div className="flex gap-2 flex-wrap">
            {statusFlow.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={ticket.status === s}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  ticket.status === s
                    ? "bg-text text-white border-text"
                    : "border-border-light text-text-secondary hover:border-text hover:text-text"
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-6">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            Nog geen berichten in dit ticket.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-[12px] border border-border-light p-4 ${
              msg.is_from_studio ? "bg-accent-soft/50" : "bg-bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-text">
                {msg.is_from_studio ? "Valck Studio" : "Klant"}
              </span>
              <span className="text-xs text-text-muted">
                {new Date(msg.created_at).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {msg.body}
            </p>
          </div>
        ))}
      </div>

      {/* Reply form */}
      <form
        onSubmit={handleReply}
        className="rounded-[12px] bg-bg-white border border-border-light p-4"
      >
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Typ je antwoord..."
          className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none mb-3"
        />
        <Button type="submit" disabled={sending || !reply.trim()}>
          <Send size={14} />
          {sending ? "Versturen..." : "Verstuur"}
        </Button>
      </form>
    </div>
  );
}
