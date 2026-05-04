import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Hammer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import type { BuildRequest, BuildRequestStatus } from "@/types/portal";
import { Button } from "@/components/ui/button";

const statusStyles: Record<BuildRequestStatus, string> = {
  ingediend: "bg-blue-bg text-blue",
  in_scoping: "bg-purple-50 text-purple-700",
  offerte: "bg-yellow-50 text-yellow-700",
  akkoord: "bg-green-bg text-green",
  afgewezen: "bg-red-50 text-red-600",
  in_bouw: "bg-orange-50 text-orange-700",
  opgeleverd: "bg-accent-soft text-text-muted",
};

const statusLabels: Record<BuildRequestStatus, string> = {
  ingediend: "Ingediend",
  in_scoping: "In scoping",
  offerte: "Offerte",
  akkoord: "Akkoord",
  afgewezen: "Afgewezen",
  in_bouw: "In bouw",
  opgeleverd: "Opgeleverd",
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export function BuildRequests() {
  const { activeClientId } = useActiveClient();
  const { user } = useAuth();
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    desired_outcome: "",
    context: "",
    priority: "normaal" as "normaal" | "hoog",
  });

  useEffect(() => {
    if (!activeClientId) return;

    supabase
      .from("build_requests")
      .select("*")
      .eq("client_id", activeClientId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Fout bij laden verzoeken");
        setRequests((data as BuildRequest[]) ?? []);
        setLoading(false);
      });
  }, [activeClientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeClientId || !user) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("build_requests")
      .insert({
        client_id: activeClientId,
        title: form.title,
        description: form.description,
        desired_outcome: form.desired_outcome,
        context: form.context || null,
        priority: form.priority,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Fout bij indienen verzoek");
    } else {
      toast.success("Build request ingediend");
      setRequests([data as BuildRequest, ...requests]);
      setForm({ title: "", description: "", desired_outcome: "", context: "", priority: "normaal" });
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
        <h1 className="text-2xl font-bold text-text">Build Requests</h1>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus size={16} />
          Nieuw verzoek
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Titel *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm"
                placeholder="Korte titel voor de feature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Beschrijving *
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none"
                placeholder="Wat wil je gebouwd hebben?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Gewenst resultaat *
              </label>
              <textarea
                required
                rows={2}
                value={form.desired_outcome}
                onChange={(e) => setForm({ ...form, desired_outcome: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none"
                placeholder="Wat moet het opleveren? Welk probleem lost het op?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Context / motivatie
              </label>
              <textarea
                rows={2}
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none"
                placeholder="Waarom is dit nu belangrijk? (optioneel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Prioriteit
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as "normaal" | "hoog" })}
                className="rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm"
              >
                <option value="normaal">Normaal</option>
                <option value="hoog">Hoog</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Indienen..." : "Verzoek indienen"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuleren
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* List */}
      {requests.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <Hammer size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted text-sm">
            Nog geen build requests. Wil je een grote feature laten bouwen? Dien een verzoek in.
          </p>
        </div>
      ) : (
        <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Offerte
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-border-light last:border-b-0 hover:bg-accent-soft/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/portal/build-requests/${req.id}`}
                      className="text-sm font-medium text-text hover:underline"
                    >
                      {req.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {req.quoted_amount_cents ? formatCents(req.quoted_amount_cents) : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted whitespace-nowrap">
                    {new Date(req.created_at).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
