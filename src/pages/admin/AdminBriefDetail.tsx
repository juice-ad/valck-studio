import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Sparkles, RefreshCw, FileText, Plus, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { DiscoveryBrief, BriefTranscript } from "@/types/portal";
import { featureCategories } from "@/lib/discovery-features";
import { createProjectFromBrief } from "@/lib/journey";

// Alle bewerkbare tekstvelden van de intake, per sectie. De admin kan deze
// óók na indienen aanpassen - de intake is de enige klant-invoer, maar de
// admin blijft de bron van waarheid.
type BriefFieldKey = Exclude<keyof DiscoveryBrief,
  "id" | "client_id" | "selected_features" | "inspiration_urls" | "ai_summary" | "ai_summary_generated_at"
  | "questionnaire_version" | "current_step" | "status" | "created_at" | "submitted_at">;
const BRIEF_SECTIONS: { title: string; fields: { key: BriefFieldKey; label: string; long?: boolean }[] }[] = [
  { title: "Bedrijf", fields: [
    { key: "business_name", label: "Bedrijfsnaam" },
    { key: "business_description", label: "Beschrijving", long: true },
    { key: "website_url", label: "Website" },
    { key: "industry", label: "Branche" },
    { key: "team_size", label: "Teamgrootte" },
    { key: "annual_revenue", label: "Jaaromzet" },
    { key: "ambition", label: "Ambitie", long: true },
    { key: "revenue_model", label: "Verdienmodel", long: true },
  ]},
  { title: "Werkwijze & Tools", fields: [
    { key: "current_tools", label: "Huidige tools", long: true },
    { key: "monthly_tool_costs", label: "Maandelijkse toolkosten" },
    { key: "time_consuming_tasks", label: "Tijdrovende taken", long: true },
    { key: "admin_hours_weekly", label: "Admin-uren per week" },
    { key: "manual_data_transfers", label: "Handmatige dataoverdrachten", long: true },
  ]},
  { title: "Pijnpunten", fields: [
    { key: "top_frustrations", label: "Top 3 frustraties", long: true },
    { key: "failure_under_pressure", label: "Wat valt om onder druk?", long: true },
    { key: "lost_clients_due_to_workflow", label: "Verloren klanten door workflow?", long: true },
    { key: "should_be_automatic", label: "Wat moet automatisch?", long: true },
  ]},
  { title: "Groei", fields: [
    { key: "growth_blockers", label: "Groeiblokkers", long: true },
    { key: "breaks_at_2x_clients", label: "Wat breekt bij 2x klanten?", long: true },
    { key: "needs_shared_platform", label: "Gedeeld platform nodig?", long: true },
  ]},
  { title: "Prioriteiten", fields: [
    { key: "automation_priority", label: "#1 automatiseringsprioriteit", long: true },
    { key: "desired_timeline", label: "Gewenste tijdlijn" },
    { key: "budget_range", label: "Budget" },
    { key: "dealbreakers", label: "Dealbreakers", long: true },
  ]},
];

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

  // Bewerken van intake-antwoorden (ook na indienen; admin is bron van waarheid)
  const [editing, setEditing] = useState(false);
  const [briefForm, setBriefForm] = useState<Record<string, string>>({});
  const [briefFeatures, setBriefFeatures] = useState<string[]>([]);
  const [savingBrief, setSavingBrief] = useState(false);

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

  function startEditing() {
    if (!brief) return;
    const form: Record<string, string> = {};
    for (const section of BRIEF_SECTIONS) {
      for (const f of section.fields) form[f.key] = (brief[f.key] as string | null) ?? "";
    }
    form.brand_colors = brief.brand_colors ?? "";
    form.brand_notes = brief.brand_notes ?? "";
    form.additional_notes = brief.additional_notes ?? "";
    form.inspiration_urls = (brief.inspiration_urls ?? []).join(", ");
    setBriefForm(form);
    setBriefFeatures(Array.isArray(brief.selected_features) ? [...brief.selected_features] : []);
    setEditing(true);
  }

  async function saveBrief() {
    if (!brief || !briefForm.business_name?.trim()) return;
    setSavingBrief(true);
    const payload: Record<string, unknown> = {};
    for (const section of BRIEF_SECTIONS) {
      for (const f of section.fields) {
        const v = (briefForm[f.key] ?? "").trim();
        payload[f.key] = f.key === "business_name" ? v : v || null;
      }
    }
    payload.brand_colors = briefForm.brand_colors.trim() || null;
    payload.brand_notes = briefForm.brand_notes.trim() || null;
    payload.additional_notes = briefForm.additional_notes.trim() || null;
    payload.inspiration_urls = briefForm.inspiration_urls.split(",").map((s) => s.trim()).filter(Boolean);
    payload.selected_features = briefFeatures;
    const { error } = await supabase.from("discovery_briefs").update(payload).eq("id", brief.id);
    if (!error) {
      setBrief((prev) => prev ? { ...prev, ...payload } as DiscoveryBrief : prev);
      setEditing(false);
    }
    setSavingBrief(false);
  }

  function toggleFeature(fid: string) {
    setBriefFeatures((prev) => prev.includes(fid) ? prev.filter((f) => f !== fid) : [...prev, fid]);
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

  const featureNames = (Array.isArray(brief.selected_features) ? brief.selected_features : []).map((fId: string) => {
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
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="text-sm text-text-muted hover:text-text px-2 py-2.5 transition-colors">Annuleer</button>
              <button onClick={saveBrief} disabled={savingBrief || !briefForm.business_name?.trim()}
                className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {savingBrief ? "Opslaan..." : "Opslaan"}
              </button>
            </>
          ) : (
            <button onClick={startEditing} className="text-sm text-text-secondary hover:text-text px-2 py-2.5 transition-colors">Bewerken</button>
          )}
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

      {/* Sections - leesweergave of bewerkmodus */}
      {BRIEF_SECTIONS.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.fields.map((f) =>
            editing ? (
              <EditField key={f.key} label={f.label} long={f.long}
                value={briefForm[f.key] ?? ""} onChange={(v) => setBriefForm((prev) => ({ ...prev, [f.key]: v }))} />
            ) : (
              <Field key={f.key} label={f.label} value={brief[f.key] as string | null} />
            )
          )}
        </Section>
      ))}

      <Section title="Inspiratie">
        {editing ? (
          <div className="sm:col-span-2">
            <p className="text-xs text-text-muted mb-1.5">Geselecteerde features</p>
            <div className="flex flex-col gap-2">
              {featureCategories.map((cat) => (
                <div key={cat.id} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-text-muted w-full">{cat.label}</span>
                  {cat.features.map((feat) => {
                    const active = briefFeatures.includes(feat.id);
                    return (
                      <button key={feat.id} type="button" onClick={() => toggleFeature(feat.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "bg-text text-white border-text" : "bg-bg border-border-light text-text-secondary hover:border-border"}`}>
                        {feat.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Field label="Geselecteerde features" value={featureNames.length > 0 ? featureNames.join(", ") : null} />
        )}
        {editing ? (
          <>
            <EditField label="Inspiratie URLs (komma-gescheiden)" value={briefForm.inspiration_urls ?? ""} onChange={(v) => setBriefForm((prev) => ({ ...prev, inspiration_urls: v }))} />
            <EditField label="Merkkleuren" value={briefForm.brand_colors ?? ""} onChange={(v) => setBriefForm((prev) => ({ ...prev, brand_colors: v }))} />
            <EditField label="Stijlnotities" long value={briefForm.brand_notes ?? ""} onChange={(v) => setBriefForm((prev) => ({ ...prev, brand_notes: v }))} />
          </>
        ) : (
          <>
            <Field label="Inspiratie URLs" value={brief.inspiration_urls?.join(", ")} />
            <Field label="Merkkleuren" value={brief.brand_colors} />
            <Field label="Stijlnotities" value={brief.brand_notes} />
          </>
        )}
      </Section>

      {editing ? (
        <Section title="Extra notities">
          <div className="sm:col-span-2">
            <EditField label="Extra notities" long value={briefForm.additional_notes ?? ""} onChange={(v) => setBriefForm((prev) => ({ ...prev, additional_notes: v }))} />
          </div>
        </Section>
      ) : brief.additional_notes ? (
        <Section title="Extra notities">
          <p className="text-sm text-text whitespace-pre-wrap">{brief.additional_notes}</p>
        </Section>
      ) : null}
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

function EditField({ label, value, onChange, long }: { label: string; value: string; onChange: (v: string) => void; long?: boolean }) {
  const cls = "w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors";
  return (
    <div>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {long ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${cls} resize-y`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
