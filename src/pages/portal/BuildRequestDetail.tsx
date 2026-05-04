import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { BuildRequest, BuildRequestLineItem, BuildRequestStatus } from "@/types/portal";
import { Button } from "@/components/ui/button";

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

export function BuildRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<BuildRequest | null>(null);
  const [lineItems, setLineItems] = useState<BuildRequestLineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [reqRes, itemsRes] = await Promise.all([
        supabase.from("build_requests").select("*").eq("id", id).single(),
        supabase
          .from("build_request_line_items")
          .select("*")
          .eq("build_request_id", id)
          .order("sort_order", { ascending: true }),
      ]);

      if (reqRes.error) {
        toast.error("Verzoek niet gevonden");
      } else {
        setRequest(reqRes.data as BuildRequest);
      }
      setLineItems((itemsRes.data as BuildRequestLineItem[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleApprove() {
    if (!request) return;
    const { error } = await supabase
      .from("build_requests")
      .update({ status: "akkoord", approved_at: new Date().toISOString() })
      .eq("id", request.id);

    if (error) {
      toast.error("Fout bij goedkeuren");
    } else {
      setRequest({ ...request, status: "akkoord" });
      toast.success("Offerte goedgekeurd");
    }
  }

  async function handleDecline() {
    if (!request) return;
    const { error } = await supabase
      .from("build_requests")
      .update({ status: "afgewezen" })
      .eq("id", request.id);

    if (error) {
      toast.error("Fout bij afwijzen");
    } else {
      setRequest({ ...request, status: "afgewezen" });
      toast.success("Offerte afgewezen");
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

  const total = lineItems.reduce((sum, item) => sum + item.amount_cents, 0);

  return (
    <div>
      <Link
        to="/portal/build-requests"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} />
        Terug naar build requests
      </Link>

      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-text">{request.title}</h1>
          <span className="text-xs text-text-muted bg-accent-soft px-2.5 py-1 rounded-full shrink-0">
            {statusLabels[request.status]}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase mb-1">
              Beschrijving
            </p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {request.description}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase mb-1">
              Gewenst resultaat
            </p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {request.desired_outcome}
            </p>
          </div>
          {request.context && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase mb-1">
                Context
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {request.context}
              </p>
            </div>
          )}
          {request.scoping_notes && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase mb-1">
                Scoping notities (Valck Studio)
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {request.scoping_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quote / Line items */}
      {lineItems.length > 0 && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-4">Offerte</h2>
          <div className="space-y-2 mb-4">
            {lineItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-secondary">{item.description}</span>
                <span className="font-medium text-text">
                  {formatCents(item.amount_cents)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border-light">
            <span className="text-sm font-semibold text-text">Totaal</span>
            <span className="text-sm font-bold text-text">
              {formatCents(total)}
            </span>
          </div>

          {/* Approve/Decline buttons */}
          {request.status === "offerte" && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleApprove}>
                <Check size={14} />
                Akkoord
              </Button>
              <Button variant="outline" onClick={handleDecline}>
                <X size={14} />
                Afwijzen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
