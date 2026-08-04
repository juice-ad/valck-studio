import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, RefreshCw, Send, Loader2, Eye, CheckCircle2,
  Clock, FileText, Download, Sparkles, ListTree, Layers,
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import type {
  Project, ProjectUpdate, ProjectPhase, VercelDeployment, PreviewFeedback,
  ReviewRound, Document, DiscoveryBrief, BriefTranscript,
} from "@/types/portal";

const phases: { key: ProjectPhase; label: string }[] = [
  { key: "discovery", label: "Ontdekken" },
  { key: "build", label: "Bouwen" },
  { key: "scale", label: "Uitbouwen" },
];
function phaseIndex(phase: ProjectPhase) {
  if (phase === "completed") return 3;
  return phases.findIndex((p) => p.key === phase);
}

const stateLabels: Record<string, { label: string; className: string }> = {
  READY: { label: "Live", className: "bg-green-bg text-green" },
  BUILDING: { label: "Bezig...", className: "bg-blue-bg text-blue" },
  ERROR: { label: "Fout", className: "bg-[#fef2f2] text-[#ef4444]" },
  QUEUED: { label: "Wachtrij", className: "bg-accent-soft text-text-muted" },
  CANCELED: { label: "Geannuleerd", className: "bg-accent-soft text-text-muted" },
};
const reviewStatusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Klaarstaan", className: "bg-accent-soft text-text-muted", icon: Clock },
  active: { label: "Actief", className: "bg-blue-bg text-blue", icon: Eye },
  completed: { label: "Afgerond", className: "bg-green-bg text-green", icon: CheckCircle2 },
};

type Tab = "voortgang" | "reviews" | "documenten" | "intake";
const TABS: { key: Tab; label: string; icon: typeof Eye }[] = [
  { key: "voortgang", label: "Voortgang", icon: Layers },
  { key: "reviews", label: "Reviews", icon: Eye },
  { key: "documenten", label: "Documenten", icon: FileText },
  { key: "intake", label: "Intake & gesprekken", icon: Sparkles },
];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "voortgang";

  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [reviewRounds, setReviewRounds] = useState<ReviewRound[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [transcripts, setTranscripts] = useState<BriefTranscript[]>([]);
  const [loading, setLoading] = useState(true);

  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<PreviewFeedback[]>([]);
  const [feedbackBody, setFeedbackBody] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const projRes = await supabase.from("projects").select("*").eq("id", id).single();
      const proj = projRes.data as Project | null;
      setProject(proj);

      const [updRes, fbRes, rrRes, docRes] = await Promise.all([
        supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("preview_feedback").select("*").eq("project_id", id).is("review_round_id", null).order("created_at", { ascending: true }),
        supabase.from("review_rounds").select("*").eq("project_id", id).order("week_number", { ascending: false }),
        supabase.from("documents").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      ]);
      setUpdates((updRes.data as ProjectUpdate[]) ?? []);
      setFeedback((fbRes.data as PreviewFeedback[]) ?? []);
      setReviewRounds((rrRes.data as ReviewRound[]) ?? []);
      setDocuments((docRes.data as Document[]) ?? []);

      if (proj?.brief_id) {
        const [bRes, tRes] = await Promise.all([
          supabase.from("discovery_briefs").select("*").eq("id", proj.brief_id).single(),
          supabase.from("brief_transcripts").select("*").eq("brief_id", proj.brief_id).order("sort_order"),
        ]);
        setBrief(bRes.data as DiscoveryBrief | null);
        setTranscripts((tRes.data as BriefTranscript[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const fetchDeployments = useCallback(async () => {
    if (!project?.vercel_project_id || !id) return;
    setDeploymentsLoading(true);
    setDeploymentsError(null);
    const { data, error } = await supabase.functions.invoke("vercel-deployments", { body: { project_id: id } });
    if (error) setDeploymentsError("Kon preview niet laden");
    else setDeployments(data?.deployments ?? []);
    setDeploymentsLoading(false);
  }, [project?.vercel_project_id, id]);

  useEffect(() => {
    if (!project?.vercel_project_id) return;
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 60_000);
    return () => clearInterval(interval);
  }, [fetchDeployments, project?.vercel_project_id]);

  async function handleFeedbackSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feedbackBody.trim() || !user || !id) return;
    const latestUrl = deployments[0]?.url ?? project?.live_url ?? "";
    setSendingFeedback(true);
    const { data, error } = await supabase.from("preview_feedback").insert({
      project_id: id, client_id: activeClientId, deployment_url: latestUrl, body: feedbackBody.trim(), status: "open",
    }).select().single();
    if (!error && data) {
      setFeedback((prev) => [...prev, data as PreviewFeedback]);
      setFeedbackBody("");
    }
    setSendingFeedback(false);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  }
  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Project niet gevonden.</p>
        <Link to="/portal/overzicht" className="text-sm text-text mt-2 inline-block no-underline hover:underline">Terug naar overzicht</Link>
      </div>
    );
  }

  const currentPhase = phaseIndex(project.phase);
  const latestDeployment = deployments[0] ?? null;
  const activeReview = reviewRounds.find((r) => r.status === "active" || r.status === "pending");

  return (
    <div className="max-w-3xl">
      <Link to="/portal/overzicht" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-4 transition-colors">
        <ArrowLeft size={16} /> Overzicht
      </Link>
      <h1 className="text-2xl font-bold text-text mb-5">{project.title}</h1>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border-light mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const count = t.key === "reviews" ? reviewRounds.length : t.key === "documenten" ? documents.length : 0;
          return (
            <button
              key={t.key}
              onClick={() => setSearchParams(t.key === "voortgang" ? {} : { tab: t.key })}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.key ? "border-text text-text" : "border-transparent text-text-muted hover:text-text"}`}
            >
              <t.icon size={15} /> {t.label}
              {count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-soft text-text-secondary">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* VOORTGANG */}
      {tab === "voortgang" && (
        <>
          {activeReview && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[12px] bg-blue-bg border border-[#bfdbfe] p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Review ronde: {activeReview.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Week {activeReview.week_number} — Bekijk de preview en geef je feedback
                    {activeReview.due_date && ` (vóór ${new Date(activeReview.due_date).toLocaleDateString("nl-NL")})`}
                  </p>
                </div>
                <Link to={`/portal/projecten/${id}/review/${activeReview.id}`} className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold no-underline hover:bg-[#333] transition-colors flex items-center gap-1.5">
                  <Eye size={14} /> Bekijken
                </Link>
              </div>
            </motion.div>
          )}

          <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
            <h2 className="text-sm font-semibold text-text mb-4">Fase</h2>
            <div className="flex items-center gap-2">
              {phases.map((phase, i) => (
                <div key={phase.key} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${i <= currentPhase ? "bg-text text-white" : "bg-accent-soft text-text-muted"}`}>{i + 1}</div>
                  <span className={`text-sm ${i <= currentPhase ? "text-text font-medium" : "text-text-muted"}`}>{phase.label}</span>
                  {i < phases.length - 1 && <div className={`flex-1 h-px ${i < currentPhase ? "bg-text" : "bg-border-light"}`} />}
                </div>
              ))}
            </div>
            {project.phase === "completed" && <p className="text-sm text-green font-medium mt-3">Project afgerond</p>}
          </div>

          <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
            <h2 className="text-sm font-semibold text-text mb-3">Projectinfo</h2>
            {project.description && <p className="text-sm text-text-secondary mb-3">{project.description}</p>}
            {project.start_date && <p className="text-xs text-text-muted">Startdatum: {new Date(project.start_date).toLocaleDateString("nl-NL")}</p>}
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-text font-medium mt-2 no-underline hover:underline">
                <ExternalLink size={14} /> Live website bekijken
              </a>
            )}
          </div>

          {project.vercel_project_id && (
            <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text">Laatste preview</h2>
                <button type="button" onClick={fetchDeployments} disabled={deploymentsLoading} className="text-xs text-text-secondary hover:text-text flex items-center gap-1 transition-colors">
                  <RefreshCw size={12} className={deploymentsLoading ? "animate-spin" : ""} /> Vernieuwen
                </button>
              </div>
              {deploymentsError && <p className="text-sm text-[#ef4444] mb-3">{deploymentsError}</p>}
              {deploymentsLoading && deployments.length === 0 ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>
              ) : latestDeployment ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stateLabels[latestDeployment.state]?.className ?? "bg-accent-soft text-text-muted"}`}>
                      {stateLabels[latestDeployment.state]?.label ?? latestDeployment.state}
                    </span>
                    <span className="text-xs text-text-muted">{new Date(latestDeployment.created).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    {latestDeployment.meta?.githubCommitMessage && <span className="text-xs text-text-secondary truncate">{latestDeployment.meta.githubCommitMessage}</span>}
                  </div>
                  {latestDeployment.state === "READY" && (
                    <a href={latestDeployment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-text font-medium no-underline hover:underline">
                      <ExternalLink size={14} /> Open preview in nieuw tabblad
                    </a>
                  )}
                </>
              ) : <p className="text-sm text-text-muted">Nog geen preview deployments.</p>}
            </div>
          )}

          {project.vercel_project_id && (
            <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
              <h2 className="text-sm font-semibold text-text mb-4">Algemene feedback</h2>
              {feedback.length === 0 ? (
                <p className="text-sm text-text-muted mb-4">Nog geen feedback. Deel je eerste reactie!</p>
              ) : (
                <div className="flex flex-col gap-3 mb-4">
                  {feedback.map((fb) => (
                    <div key={fb.id} className="border-l-2 border-border-light pl-4 py-1">
                      <p className="text-sm text-text">{fb.body}</p>
                      <p className="text-xs text-text-muted mt-1">{new Date(fb.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
                <textarea value={feedbackBody} onChange={(e) => setFeedbackBody(e.target.value)} placeholder="Wat vind je van de preview? Iets wat je anders wilt?" rows={2}
                  className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none" />
                <button type="submit" disabled={sendingFeedback || !feedbackBody.trim()} className="self-end bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {sendingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          )}

          <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
            <h2 className="text-sm font-semibold text-text mb-4">Updates</h2>
            {updates.length === 0 ? (
              <p className="text-sm text-text-muted">Nog geen updates.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {updates.map((u) => (
                  <div key={u.id} className="border-l-2 border-border-light pl-4 py-1">
                    <p className="text-sm font-medium text-text">{u.title}</p>
                    {u.body && <p className="text-sm text-text-secondary mt-1">{u.body}</p>}
                    <p className="text-xs text-text-muted mt-1">{new Date(u.created_at).toLocaleDateString("nl-NL")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* REVIEWS */}
      {tab === "reviews" && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-sm font-semibold text-text mb-4">Klik-rondes</h2>
          {reviewRounds.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen review rondes. Deze verschijnen zodra we een preview klaarzetten.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviewRounds.map((round) => {
                const config = reviewStatusConfig[round.status];
                const StatusIcon = config.icon;
                return (
                  <Link key={round.id} to={`/portal/projecten/${id}/review/${round.id}`}
                    className="flex items-center gap-3 p-3 rounded-[8px] border border-border-light hover:border-border no-underline transition-colors">
                    <StatusIcon size={18} className={config.className.split(" ").pop()} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{round.title}</p>
                      <p className="text-xs text-text-muted">
                        Week {round.week_number}
                        {round.due_date && ` · feedback vóór ${new Date(round.due_date).toLocaleDateString("nl-NL")}`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>{config.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENTEN */}
      {tab === "documenten" && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-sm font-semibold text-text mb-4">Documenten</h2>
          {documents.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen documenten bij dit project.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-[8px] border border-border-light hover:border-border no-underline transition-colors">
                  <div className="w-9 h-9 rounded-[8px] bg-accent-soft flex items-center justify-center shrink-0"><FileText size={17} className="text-text-muted" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text truncate">{doc.name}</p>
                    <p className="text-xs text-text-muted">{new Date(doc.created_at).toLocaleDateString("nl-NL")}</p>
                  </div>
                  <Download size={15} className="text-text-muted shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INTAKE & GESPREKKEN */}
      {tab === "intake" && (
        <div className="flex flex-col gap-4">
          {!brief ? (
            <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
              <p className="text-sm text-text-muted">Er is nog geen intake aan dit project gekoppeld.</p>
            </div>
          ) : (
            <>
              {brief.ai_summary && (
                <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
                  <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-3"><Sparkles size={14} /> Samenvatting</h2>
                  <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">{brief.ai_summary}</div>
                </div>
              )}
              {transcripts.length > 0 && (
                <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
                  <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4"><ListTree size={14} /> Gesprekken & context</h2>
                  <div className="flex flex-col gap-2">
                    {transcripts.map((t) => (
                      <details key={t.id} className="rounded-[8px] border border-border-light bg-bg">
                        <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-text">{t.title}</span>
                          <span className="text-xs text-text-muted">{t.kind === "summary" ? "Samenvatting" : "Transcript"}{t.meeting_date && ` · ${new Date(t.meeting_date).toLocaleDateString("nl-NL")}`}</span>
                        </summary>
                        <div className="px-4 pb-4 text-sm text-text whitespace-pre-wrap leading-relaxed border-t border-border-light pt-3">{t.body}</div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
                <h2 className="text-sm font-semibold text-text mb-4">Jullie antwoorden</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <IntakeField label="Bedrijf" value={brief.business_name} />
                  <IntakeField label="Ambitie" value={brief.ambition} />
                  <IntakeField label="Huidige tools" value={brief.current_tools} />
                  <IntakeField label="Top frustraties" value={brief.top_frustrations} />
                  <IntakeField label="Wat moet automatisch?" value={brief.should_be_automatic} />
                  <IntakeField label="#1 prioriteit" value={brief.automation_priority} />
                  <IntakeField label="Budget" value={brief.budget_range} />
                  <IntakeField label="Tijdlijn" value={brief.desired_timeline} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function IntakeField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm ${value ? "text-text" : "text-text-muted italic"} whitespace-pre-wrap`}>{value || "Niet ingevuld"}</p>
    </div>
  );
}
