import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { BuildRequest, BuildRequestLineItem, BuildRequestStatus } from "@/types/portal";
import { Button } from "@/components/ui/button";

const statusFlow: BuildRequestStatus[] = [
  "ingediend",
  "in_scoping",
  "offerte",
  "akkoord",
  "in_bouw",
  "opgeleverd",
];

const statusLabels: Record<BuildRequestStatus, string> = {
  ingediend: "Ingediend",
  in_scoping: "In scoping",
  offerte: "Offerte",
  akkoord: "Akkoord",
  afgewezen: "Afgewezen",
  in_bouw: "In bouw",
  opgeleverd: "Opgeleverd",
};

type RequestWithClient = BuildRequest & {
  client: { company_name: string } | null;
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export function AdminBuildRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestWithClient | null>(null);
  const [lineItems, setLineItems] = useState<BuildRequestLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopingNotes, setScopingNotes] = useState("");
  const [newItem, setNewItem] = useState({ description: "", amount: "" });

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [reqRes, itemsRes] = await Promise.all([
        supabase
          .from("build_requests")
          .select("*, client:clients(company_name)")
          .eq("id", id)
          .single(),
        supabase
          .from("build_request_line_items")
          .select("*")
          .eq("build_request_id", id)
          .order("sort_order", { ascending: true }),
      ]);

      if (reqRes.error) {
        toast.error("Verzoek niet gevonden");
      } else {
        const req = reqRes.data as RequestWithClient;
        setRequest(req);
        setScopingNotes(req.scoping_notes ?? "");
      }
      setLineItems((itemsRes.data as BuildRequestLineItem[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleStatusChange(newStatus: BuildRequestStatus) {
    if (!request) return;

    const total = lineItems.reduce((sum, i) => sum + i.amount_cents, 0);
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "offerte" && total > 0) {
      updates.quoted_amount_cents = total;
    }

    const { error } = await supabase
      .from("build_requests")
      .update(updates)
      .eq("id", request.id);

    if (error) {
      toast.error("Fout bij status update");
    } else {
      setRequest({ ...request, ...updates } as RequestWithClient);
      toast.success(`Status: ${statusLabels[newStatus]}`);
    }
  }

  async function handleSaveScopingNotes() {
    if (!request) return;
    const { error } = await supabase
      .from("build_requests")
      .update({ scoping_notes: scopingNotes })
      .eq("id", request.id);

    if (error) {
      toast.error("Fout bij opslaan");
    } else {
      toast.success("Scoping notities opgeslagen");
    }
  }

  async function handleAddLineItem(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newItem.description || !newItem.amount) return;

    const amountCents = Math.round(parseFloat(newItem.amount) * 100);
    if (isNaN(amountCents)) {
      toast.error("Ongeldig bedrag");
      return;
    }

    const { data, error } = await supabase
      .from("build_request_line_items")
      .insert({
        build_request_id: id,
        description: newItem.description,
        amount_cents: amountCents,
        sort_order: lineItems.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Fout bij toevoegen");
    } else {
      setLineItems([...lineItems, data as BuildRequestLineItem]);
      setNewItem({ description: "", amount: "" });
    }
  }

  async function handleRemoveLineItem(itemId: string) {
    const { error } = await supabase
      .from("build_request_line_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Fout bij verwijderen");
    } else {
      setLineItems(lineItems.filter((i) => i.id !== itemId));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Verzoek niet gevonden.</p>
      </div>
    );
  }

  const total = lineItems.reduce((sum, i) => sum + i.amount_cents, 0);

  return (
    <div>
      <Link
        to="/admin/build-requests"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} />
        Terug naar pipeline
      </Link>

      {/* Request info */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-xl font-bold text-text">{request.title}</h1>
          <span className="text-xs text-text-muted shrink-0">
            {request.client?.company_name}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase mb-1">Beschrijving</p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{request.description}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase mb-1">Gewenst resultaat</p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{request.desired_outcome}</p>
          </div>
          {request.context && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase mb-1">Context</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{request.context}</p>
            </div>
          )}
        </div>

        {/* Status controls */}
        <div className="pt-4 border-t border-border-light">
          <p className="text-xs font-semibold text-text-muted uppercase mb-2">Status</p>
          <div className="flex gap-2 flex-wrap">
            {statusFlow.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={request.status === s}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  request.status === s
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

      {/* Scoping notes */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Scoping notities</h2>
        <textarea
          value={scopingNotes}
          onChange={(e) => setScopingNotes(e.target.value)}
          rows={4}
          className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none mb-3"
          placeholder="Notities over scope, aanpak, afhankelijkheden..."
        />
        <Button variant="outline" size="sm" onClick={handleSaveScopingNotes}>
          Opslaan
        </Button>
      </div>

      {/* Line items (quote) */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        <h2 className="text-sm font-semibold text-text mb-4">Offerte regels</h2>

        {lineItems.length > 0 && (
          <div className="space-y-2 mb-4">
            {lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{item.description}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">{formatCents(item.amount_cents)}</span>
                  <button
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="text-text-muted hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-border-light">
              <span className="text-sm font-semibold text-text">Totaal</span>
              <span className="text-sm font-bold text-text">{formatCents(total)}</span>
            </div>
          </div>
        )}

        {/* Add line item */}
        <form onSubmit={handleAddLineItem} className="flex gap-2">
          <input
            type="text"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Omschrijving"
            className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            step="0.01"
            value={newItem.amount}
            onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
            placeholder="Bedrag"
            className="w-28 rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm"
            required
          />
          <Button type="submit" size="sm" variant="outline">
            <Plus size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
}
