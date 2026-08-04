import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, RefreshCw, FileText, Plus, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { DiscoveryBrief, BriefTranscript } from "@/types/portal";
import { featureCategories } from "@/lib/discovery-features";
import { createProjectFromBrief } from "@/lib/journey";

export function AdminBriefDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [transcripts, setTranscripts] = useState<BriefTranscript[]>([]);
  const [existingProjectId, setExistingProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showAddTranscript, setShowAddTranscript] = useState(false);
  const [tForm, setTForm] = useState({ title: "", kind: "transcript", body: "", meeting_date: "" });

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [briefRes, transRes] = await Promise.all([
        supabase.from("discovery_briefs").select("*").eq("id", id!).single(),
        supabase.from("brief_transcripts").select("*").eq("brief_id", id!).order("sort_order"),
      ]);
      const b = briefRes.data as DiscoveryBrief | null;
      setBrief(b);
      setTranscripts((transRes.data as BriefTranscript[]) ?? []);
      if (b) {
        const { data: proj } = await supabase
          .from("projects").select("id").eq("brief_id", b.id).limit(1);
        setExistingProjectId((proj?.[0]?.id as string) ?? null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleCreateProject() {
    if (!brief) return;
    setCreatingProject(true);
    const projectId = await createProjectFromBrief(brief);
    setCreatingProject(false);
    if (projectId) {
      navigate(`/admin/projecten/${projectId}`);
    }
  }

  async function addTranscript() {
    if (!brief || !tForm.title.trim() || !tForm.body.trim()) return;
    const { data } = await supabase.from("brief_transcripts").insert({
      brief_id: brief.id,
      client_id: brief.client_id,
      title: tForm.title.trim(),
      kind: tForm.kind,
      body: tForm.body.trim(),
      sort_order: transcripts.length,
      meeting_date: tForm.meeting_date || null,
    }).select("*").single();
    if (data) setTranscripts((prev) => [...prev, data as BriefTranscript]);
    setTForm({ title: "", kind: "transcript", body: "", meeting_date: "" });
    setShowAddTranscript(false);
  }

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
        <div className="flex items-center gap-2">
          {existingProjectId ? (
            <Link
              to={`/admin/projecten/${existingProjectId}`}
              className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline hover:opacity-90 transition-opacity"
            >
              <Rocket size={16} /> Bekijk project
            </Link>
          ) : (
            <button
              onClick={handleCreateProject}
              disabled={creatingProject}
              className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Rocket size={16} />
              {creatingProject ? "Bezig..." : "Maak project van deze intake"}
            </button>
          )}
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

      {/* Transcripts / context */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <FileText size={14} /> Gesprekken & context ({transcripts.length})
          </h2>
          <button
            onClick={() => setShowAddTranscript((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text transition-colors"
          >
            <Plus size={13} /> Toevoegen
          </button>
        </div>

        {showAddTranscript && (
          <div className="mb-4 p-4 rounded-[8px] bg-bg border border-border-light flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Titel (bijv. Gesprek 30 juli, deel 1)"
                value={tForm.title}
                onChange={(e) => setTForm({ ...tForm, title: e.target.value })}
                className="sm:col-span-2 rounded-[8px] border border-border-light bg-bg-white px-3 py-2 text-sm"
              />
              <select
                value={tForm.kind}
                onChange={(e) => setTForm({ ...tForm, kind: e.target.value })}
                className="rounded-[8px] border border-border-light bg-bg-white px-3 py-2 text-sm"
              >
                <option value="transcript">Transcript</option>
                <option value="summary">Samenvatting</option>
              </select>
            </div>
            <textarea
              placeholder="Plak hier het transcript of de samenvatting…"
              rows={5}
              value={tForm.body}
              onChange={(e) => setTForm({ ...tForm, body: e.target.value })}
              className="rounded-[8px] border border-border-light bg-bg-white px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={tForm.meeting_date}
                onChange={(e) => setTForm({ ...tForm, meeting_date: e.target.value })}
                className="rounded-[8px] border border-border-light bg-bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={addTranscript}
                className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold"
              >
                Opslaan
              </button>
            </div>
          </div>
        )}

        {transcripts.length === 0 ? (
          <p className="text-sm text-text-muted italic">
            Nog geen transcripts. Plak de gespreksopnames zodat de context achter de intake bewaard blijft.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {transcripts.map((t) => (
              <details key={t.id} className="group rounded-[8px] border border-border-light bg-bg">
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
