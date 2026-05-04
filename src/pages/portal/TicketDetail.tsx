import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket, TicketMessage, TicketStatus } from "@/types/portal";
import { Button } from "@/components/ui/button";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-blue-bg text-blue",
  in_behandeling: "bg-yellow-50 text-yellow-700",
  opgelost: "bg-green-bg text-green",
  gesloten: "bg-accent-soft text-text-muted",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  opgelost: "Opgelost",
  gesloten: "Gesloten",
};

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [ticketRes, messagesRes] = await Promise.all([
        supabase.from("tickets").select("*").eq("id", id).single(),
        supabase
          .from("ticket_messages")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (ticketRes.error) {
        toast.error("Ticket niet gevonden");
      } else {
        setTicket(ticketRes.data as Ticket);
      }
      setMessages((messagesRes.data as TicketMessage[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id]);

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
        is_from_studio: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Fout bij versturen bericht");
    } else {
      setMessages([...messages, data as TicketMessage]);
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

  const isClosed = ticket.status === "gesloten";

  return (
    <div>
      {/* Header */}
      <Link
        to="/portal/tickets"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} />
        Terug naar tickets
      </Link>

      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-text">{ticket.subject}</h1>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyles[ticket.status]}`}
          >
            {statusLabels[ticket.status]}
          </span>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {ticket.description}
        </p>
        <p className="text-xs text-text-muted mt-4">
          Aangemaakt op{" "}
          {new Date(ticket.created_at).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Messages thread */}
      <div className="space-y-3 mb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-[12px] border border-border-light p-4 ${
              msg.is_from_studio ? "bg-accent-soft/50" : "bg-bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-text">
                {msg.is_from_studio ? "Valck Studio" : "Jij"}
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
      {!isClosed && (
        <form
          onSubmit={handleReply}
          className="rounded-[12px] bg-bg-white border border-border-light p-4"
        >
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Typ je reactie..."
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none mb-3"
          />
          <Button type="submit" disabled={sending || !reply.trim()}>
            <Send size={14} />
            {sending ? "Versturen..." : "Verstuur"}
          </Button>
        </form>
      )}
    </div>
  );
}
