import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/portal";

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

type TicketWithClient = Ticket & {
  client: { company_name: string } | null;
};

export function AdminTickets() {
  const [tickets, setTickets] = useState<TicketWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  useEffect(() => {
    supabase
      .from("tickets")
      .select("*, client:clients(company_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTickets((data as TicketWithClient[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered =
    statusFilter === "all"
      ? tickets
      : tickets.filter((t) => t.status === statusFilter);

  function getAge(createdAt: string) {
    const days = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Vandaag";
    if (days === 1) return "1 dag";
    return `${days} dagen`;
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
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as TicketStatus | "all")
          }
          className="rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm"
        >
          <option value="all">Alle statussen</option>
          <option value="open">Open</option>
          <option value="in_behandeling">In behandeling</option>
          <option value="opgelost">Opgelost</option>
          <option value="gesloten">Gesloten</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">Geen tickets gevonden.</p>
        </div>
      ) : (
        <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Klant
                  </th>
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
                    Leeftijd
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-accent-soft/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {ticket.client?.company_name ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/tickets/${ticket.id}`}
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
                      {getAge(ticket.created_at)}
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
