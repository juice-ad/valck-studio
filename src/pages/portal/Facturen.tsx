import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Invoice, InvoiceStatus } from "@/types/portal";

const statusStyles: Record<InvoiceStatus, string> = {
  concept: "bg-accent-soft text-text-muted",
  verstuurd: "bg-blue-bg text-blue",
  betaald: "bg-green-bg text-green",
  vervallen: "bg-red-50 text-red-600",
};

const statusLabels: Record<InvoiceStatus, string> = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  betaald: "Betaald",
  vervallen: "Vervallen",
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export function Facturen() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setInvoices((data as Invoice[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Facturen</h1>

      {invoices.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">
            Er zijn nog geen facturen beschikbaar.
          </p>
        </div>
      ) : (
        <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Nummer
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Omschrijving
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Vervaldatum
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border-light last:border-b-0"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-text whitespace-nowrap">
                      {inv.number}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {inv.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text whitespace-nowrap">
                      {formatCents(inv.amount_cents)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("nl-NL")
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[inv.status]}`}
                      >
                        {statusLabels[inv.status]}
                      </span>
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
