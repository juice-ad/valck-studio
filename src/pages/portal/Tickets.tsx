import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/portal";
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

const priorityStyles: Record<TicketPriority, string> = {
  laag: "text-text-muted",
  normaal: "text-text-secondary",
  hoog: "text-orange-600",
  urgent: "text-red-600 font-semibold",
};

export function Tickets() {
  const { activeClientId } = useActiveClient();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "normaal" as TicketPriority,
  });

  useEffect(() => {
    if (!activeClientId) return;

    supabase
      .from("tickets")
      .select("*")
      .eq("client_id", activeClientId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Fout bij laden tickets");
        setTickets((data as Ticket[]) ?? []);
        setLoading(false);
      });
  }, [activeClientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeClientId || !user) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        client_id: activeClientId,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Fout bij aanmaken ticket");
    } else {
      toast.success("Ticket aangemaakt");
      setTickets([data as Ticket, ...tickets]);
      setForm({ subject: "", description: "", priority: "normaal" });
      setShowForm(false);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Tickets</h1>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus size={16} />
          Nieuw ticket
        </Button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Onderwerp *
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm"
                placeholder="Kort beschrijving van het probleem"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Beschrijving *
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none"
                placeholder="Geef zoveel mogelijk detail over wat er mis gaat..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Prioriteit
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TicketPriority })
                }
                className="rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm"
              >
                <option value="laag">Laag</option>
                <option value="normaal">Normaal</option>
                <option value="hoog">Hoog</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Versturen..." : "Ticket aanmaken"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <LifeBuoy size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted text-sm">
            Nog geen tickets. Heb je hulp nodig? Maak een nieuw ticket aan.
          </p>
        </div>
      ) : (
        <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Onderwerp
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Prioriteit
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Aangemaakt
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-accent-soft/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/portal/tickets/${ticket.id}`}
                        className="text-sm font-medium text-text hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs capitalize ${priorityStyles[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[ticket.status]}`}
                      >
                        {statusLabels[ticket.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted whitespace-nowrap">
                      {new Date(ticket.created_at).toLocaleDateString("nl-NL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
