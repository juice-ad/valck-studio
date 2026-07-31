import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { DiscoveryBrief } from "@/types/portal";
import { featureCategories } from "@/lib/discovery-features";

export function AdminBriefDetail() {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("discovery_briefs").select("*").eq("id", id).single().then(({ data }) => {
      setBrief(data as DiscoveryBrief | null);
      setLoading(false);
    });
  }, [id]);

  async function markReviewed() {
    if (!id) return;
    setMarking(true);
    await supabase.from("discovery_briefs").update({ status: "reviewed" }).eq("id", id);
    setBrief((prev) => prev ? { ...prev, status: "reviewed" } : prev);
    setMarking(false);
  }

  async function generateSummary() {
    if (!id) return;
    setGeneratingSummary(true);
    setSummaryError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-brief-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ briefId: id }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Kon samenvatting niet genereren");
      setBrief((prev) =>
        prev
          ? { ...prev, ai_summary: result.summary, ai_summary_generated_at: result.generated_at }
          : prev
      );
    } catch (err) {
      setSummaryError((err as Error).message);
    } finally {
      setGeneratingSummary(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Intake niet gevonden.</p>
        <Link to="/admin/briefs" className="text-sm text-text mt-2 inline-block no-underline hover:underline">Terug</Link>
      </div>
    );
  }

  const featureNames = (brief.selected_features ?? []).map((fId: string) => {
    for (const cat of featureCategories) {
      const feat = cat.features.find((f: { id: string; label: string }) => f.id === fId);
      if (feat) return feat.label;
    }
    return fId;
  });

  return (
    <div>
      <Link to="/admin/briefs" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors">
        <ArrowLeft size={16} /> Terug
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{brief.business_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              brief.status === "submitted" ? "bg-blue-bg text-blue" :
              brief.status === "reviewed" ? "bg-green-bg text-green" :
              "bg-accent-soft text-text-muted"
            }`}>
              {brief.status === "submitted" ? "Ingediend" : brief.status === "reviewed" ? "Beoordeeld" : "Concept"}
            </span>
            {brief.submitted_at && (
              <span className="text-xs text-text-muted">
                {new Date(brief.submitted_at).toLocaleDateString("nl-NL")}
              </span>
            )}
          </div>
        </div>
        {brief.status === "submitted" && (
          <button
            onClick={markReviewed}
            disabled={marking}
            className="inline-flex items-center gap-2 bg-green text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#0d9668] transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            {marking ? "Bezig..." : "Markeer als beoordeeld"}
          </button>
        )}
      </div>

      {/* AI Summary */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Sparkles size={14} />
            AI-samenvatting
          </h2>
          {brief.status !== "draft" && (
            <button
              onClick={generateSummary}
              disabled={generatingSummary}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text transition-colors disabled:opacity-50"
            >
              {generatingSummary ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Genereren...
                </>
              ) : brief.ai_summary ? (
                <>
                  <RefreshCw size={13} />
                  Opnieuw genereren
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Genereer samenvatting
                </>
              )}
            </button>
          )}
        </div>
        {summaryError && (
          <p className="text-sm text-[#ef4444] mb-3">{summaryError}</p>
        )}
        {brief.ai_summary ? (
          <div>
            <div className="text-sm text-text whitespace-pre-wrap leading-relaxed prose-sm">
              {brief.ai_summary}
            </div>
            {brief.ai_summary_generated_at && (
              <p className="text-xs text-text-muted mt-3">
                Gegenereerd op{" "}
                {new Date(brief.ai_summary_generated_at).toLocaleString("nl-NL")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">
            {brief.status === "draft"
              ? "Samenvatting beschikbaar na indiening van de intake."
              : "Nog geen samenvatting gegenereerd."}
          </p>
        )}
      </div>

      {/* Sections */}
      <Section title="Bedrijf">
        <Field label="Bedrijfsnaam" value={brief.business_name} />
        <Field label="Beschrijving" value={brief.business_description} />
        <Field label="Website" value={brief.website_url} />
        <Field label="Branche" value={brief.industry} />
        <Field label="Teamgrootte" value={brief.team_size} />
        <Field label="Jaaromzet" value={brief.annual_revenue} />
        <Field label="Ambitie" value={brief.ambition} />
        <Field label="Verdienmodel" value={brief.revenue_model} />
      </Section>

      <Section title="Werkwijze & Tools">
        <Field label="Huidige tools" value={brief.current_tools} />
        <Field label="Maandelijkse toolkosten" value={brief.monthly_tool_costs} />
        <Field label="Tijdrovende taken" value={brief.time_consuming_tasks} />
        <Field label="Admin-uren per week" value={brief.admin_hours_weekly} />
        <Field label="Handmatige dataoverdrachten" value={brief.manual_data_transfers} />
      </Section>

      <Section title="Pijnpunten">
        <Field label="Top 3 frustraties" value={brief.top_frustrations} />
        <Field label="Wat valt om onder druk?" value={brief.failure_under_pressure} />
        <Field label="Verloren klanten door workflow?" value={brief.lost_clients_due_to_workflow} />
        <Field label="Wat moet automatisch?" value={brief.should_be_automatic} />
      </Section>

      <Section title="Groei">
        <Field label="Groeiblokkers" value={brief.growth_blockers} />
        <Field label="Wat breekt bij 2x klanten?" value={brief.breaks_at_2x_clients} />
        <Field label="Gedeeld platform nodig?" value={brief.needs_shared_platform} />
      </Section>

      <Section title="Prioriteiten">
        <Field label="#1 automatiseringsprioriteit" value={brief.automation_priority} />
        <Field label="Gewenste tijdlijn" value={brief.desired_timeline} />
        <Field label="Budget" value={brief.budget_range} />
        <Field label="Dealbreakers" value={brief.dealbreakers} />
      </Section>

      <Section title="Inspiratie">
        <Field label="Geselecteerde features" value={featureNames.length > 0 ? featureNames.join(", ") : null} />
        <Field label="Inspiratie URLs" value={brief.inspiration_urls?.join(", ")} />
        <Field label="Merkkleuren" value={brief.brand_colors} />
        <Field label="Stijlnotities" value={brief.brand_notes} />
      </Section>

      {brief.additional_notes && (
        <Section title="Extra notities">
          <p className="text-sm text-text whitespace-pre-wrap">{brief.additional_notes}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
      <h2 className="text-sm font-semibold text-text mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm ${value ? "text-text" : "text-text-muted italic"} whitespace-pre-wrap`}>
        {value || "Niet ingevuld"}
      </p>
    </div>
  );
}
