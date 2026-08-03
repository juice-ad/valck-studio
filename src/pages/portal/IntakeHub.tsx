import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import type { DiscoveryBrief, BriefTranscript } from "@/types/portal";

export function IntakeHub() {
  const { activeClientId } = useActiveClient();
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [transcripts, setTranscripts] = useState<BriefTranscript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClientId) return;
    async function load() {
      const { data: briefs } = await supabase
        .from("discovery_briefs")
        .select("*")
        .eq("client_id", activeClientId!)
        .order("created_at", { ascending: false })
        .limit(1);
      const b = (briefs?.[0] as DiscoveryBrief) ?? null;
      setBrief(b);
      if (b) {
        const { data: trans } = await supabase
          .from("brief_transcripts")
          .select("*")
          .eq("brief_id", b.id)
          .order("sort_order");
        setTranscripts((trans as BriefTranscript[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, [activeClientId]);

  if (loading) {
    return <p className="text-sm text-text-muted">Intake wordt geladen…</p>;
  }

  // Geen brief of nog concept -> naar de wizard
  if (!brief || brief.status === "draft") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-text mb-2">Intake</h1>
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center mt-6">
          <Sparkles className="mx-auto mb-3 text-text-muted" size={28} />
          <p className="text-text font-medium mb-1">
            {brief ? "Je intake staat nog open" : "Vertel ons over jullie bedrijf"}
          </p>
          <p className="text-sm text-text-muted mb-5">
            {brief
              ? `Je was bij stap ${(brief.current_step ?? 0) + 1} van 8.`
              : "De intake is de basis van jullie hele traject."}
          </p>
          <Link
            to="/portal/discovery"
            className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline"
          >
            {brief ? "Intake hervatten" : "Start de intake"} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-text mb-1">Intake</h1>
      <p className="text-text-secondary mb-6">Alles wat we over jullie weten, op één plek.</p>

      {/* Status */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-bg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              Intake {brief.status === "reviewed" ? "beoordeeld" : "ingediend"}
            </p>
            <p className="text-xs text-text-muted">
              {brief.submitted_at
                ? new Date(brief.submitted_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* AI-samenvatting */}
      {brief.ai_summary && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-text" />
            <h2 className="text-sm font-semibold text-text">Samenvatting</h2>
          </div>
          <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">{brief.ai_summary}</div>
        </div>
      )}

      {/* Gesprekken & context */}
      {transcripts.length > 0 && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <FileText size={14} /> Gesprekken & context
          </h2>
          <div className="flex flex-col gap-2">
            {transcripts.map((t) => (
              <details key={t.id} className="rounded-[8px] border border-border-light bg-bg">
                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-text">{t.title}</span>
                  <span className="text-xs text-text-muted">
                    {t.kind === "summary" ? "Samenvatting" : "Transcript"}
                    {t.meeting_date && ` · ${new Date(t.meeting_date).toLocaleDateString("nl-NL")}`}
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-text whitespace-pre-wrap leading-relaxed border-t border-border-light pt-3">
                  {t.body}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Antwoorden per sectie */}
      <HubSection title="Bedrijf">
        <HubField label="Bedrijfsnaam" value={brief.business_name} />
        <HubField label="Beschrijving" value={brief.business_description} />
        <HubField label="Teamgrootte" value={brief.team_size} />
        <HubField label="Ambitie" value={brief.ambition} />
      </HubSection>
      <HubSection title="Werkwijze & tools">
        <HubField label="Huidige tools" value={brief.current_tools} />
        <HubField label="Tijdrovende taken" value={brief.time_consuming_tasks} />
        <HubField label="Handmatige overdrachten" value={brief.manual_data_transfers} />
      </HubSection>
      <HubSection title="Pijnpunten">
        <HubField label="Top frustraties" value={brief.top_frustrations} />
        <HubField label="Wat moet automatisch?" value={brief.should_be_automatic} />
      </HubSection>
      <HubSection title="Prioriteiten">
        <HubField label="#1 prioriteit" value={brief.automation_priority} />
        <HubField label="Budget" value={brief.budget_range} />
        <HubField label="Tijdlijn" value={brief.desired_timeline} />
      </HubSection>

      {/* CTA */}
      <div className="rounded-[12px] bg-blue-bg border border-[#bfdbfe] p-5 mt-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-text">Klopt er iets niet, of wil je iets toevoegen?</p>
          <p className="text-xs text-text-secondary mt-0.5">Stuur ons een bericht, dan passen we het samen aan.</p>
        </div>
        <Link
          to="/portal/berichten"
          className="shrink-0 inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline"
        >
          <MessageCircle size={15} /> Bericht sturen
        </Link>
      </div>
    </div>
  );
}

function HubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
      <h2 className="text-sm font-semibold text-text mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function HubField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm ${value ? "text-text" : "text-text-muted italic"} whitespace-pre-wrap`}>
        {value || "Niet ingevuld"}
      </p>
    </div>
  );
}
