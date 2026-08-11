import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Flag, ExternalLink, RefreshCw, Send, Loader2, Eye, CheckCircle2,
  Clock, FileText, Download, Sparkles, ListTree, Layers, MessagesSquare,
  Calendar, CalendarPlus, CalendarClock, Circle, Boxes, ChevronRight, CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { downloadICS, googleCalendarUrl } from "@/lib/ics";
import { MODULE_STATUS, MODULE_KIND, moduleIcon, formatMonthly, normalizeModuleKind } from "@/lib/modules";
import { ActivityFeed } from "@/components/portal/ActivityFeed";
import type {
  Project, ProjectUpdate, ProjectPhase, VercelDeployment, PreviewFeedback,
  ReviewRound, Document, DiscoveryBrief, BriefTranscript, WorkflowStep, Meeting, Module, Invoice, ProjectCost,
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
type Tab = "modules" | "voortgang" | "intake" | "gesprekken" | "documenten";
const TABS: { key: Tab; label: string; icon: typeof Eye }[] = [
  { key: "modules", label: "Modules", icon: Boxes },
  { key: "voortgang", label: "Voortgang", icon: Layers },
  { key: "intake", label: "Intake", icon: Sparkles },
  { key: "gesprekken", label: "Gesprekken", icon: MessagesSquare },
  { key: "documenten", label: "Documenten", icon: FileText },
];

const stepStatusConfig: Record<string, { icon: typeof Circle; className: string }> = {
  completed: { icon: CheckCircle2, className: "text-green" },
  in_progress: { icon: Clock, className: "text-blue" },
  blocked: { icon: Circle, className: "text-[#ef4444]" },
  pending: { icon: Circle, className: "text-text-muted" },
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "modules";

  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [reviewRounds, setReviewRounds] = useState<ReviewRound[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [transcripts, setTranscripts] = useState<BriefTranscript[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [openInvoice, setOpenInvoice] = useState<Invoice | null>(null);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
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

      const [modRes, updRes, fbRes, rrRes, docRes, stepRes, mtRes, invRes, costRes] = await Promise.all([
        supabase.from("modules").select("*").eq("project_id", id).order("sequence_order"),
        supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("preview_feedback").select("*").eq("project_id", id).is("review_round_id", null).order("created_at", { ascending: true }),
        supabase.from("review_rounds").select("*").eq("project_id", id).order("week_number", { ascending: false }),
        supabase.from("documents").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("workflow_steps").select("*").eq("project_id", id).order("sequence_order"),
        supabase.from("meetings").select("*").eq("project_id", id).order("scheduled_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("project_id", id).eq("status", "verstuurd").order("created_at", { ascending: false }).limit(1),
        supabase.from("project_costs").select("*").eq("project_id", id).order("sequence_order"),
      ]);
      setModules((modRes.data as Module[]) ?? []);
      setUpdates((updRes.data as ProjectUpdate[]) ?? []);
      setFeedback((fbRes.data as PreviewFeedback[]) ?? []);
      setReviewRounds((rrRes.data as ReviewRound[]) ?? []);
      setDocuments((docRes.data as Document[]) ?? []);
      setSteps((stepRes.data as WorkflowStep[]) ?? []);
      setMeetings((mtRes.data as Meeting[]) ?? []);
      setOpenInvoice((invRes.data?.[0] as Invoice) ?? null);
      setCosts((costRes.data as ProjectCost[]) ?? []);

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
        <Link to="/portal/project" className="text-sm text-text mt-2 inline-block no-underline hover:underline">Terug naar overzicht</Link>
      </div>
    );
  }

  const currentPhase = phaseIndex(project.phase);
  const latestDeployment = deployments[0] ?? null;
  const activeReview = reviewRounds.find((r) => r.status === "active" || r.status === "pending");
  const latestDrop = updates.find((u) => u.kind === "drop");
  const showDrop = !!latestDrop && Date.now() - new Date(latestDrop.created_at).getTime() < 10 * 24 * 3600 * 1000;
  const agentModules = modules.filter((m) => normalizeModuleKind(m.kind) === "agent");
  const monthlyTotal = agentModules.reduce((s, m) => s + (m.monthly_price_cents ?? 0), 0);
  const journeyDone = project.phase === "completed" || (steps.length > 0 && steps.every((s) => s.status === "completed"));
  const showAgentTeaser = journeyDone && agentModules.length === 0;

  return (
    <div className="max-w-3xl">
      <Link to="/portal/project" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-4 transition-colors">
        <ArrowLeft size={16} /> Projecten
      </Link>
      <h1 className="text-2xl font-bold text-text mb-5">{project.title}</h1>

      {/* Nu aan de beurt - de trek, zichtbaar op elke tab */}
      {activeReview && (
        <Link to={`/portal/projecten/${id}/review/${activeReview.id}`} className="flex items-center justify-between gap-4 rounded-[12px] bg-blue-bg border border-[#bfdbfe] p-4 mb-5 no-underline hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 min-w-0">
            <Flag size={16} className="text-blue shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">Nu aan de beurt: {activeReview.title}</p>
              <p className="text-xs text-text-secondary">Week {activeReview.week_number}: bekijk de preview en geef je feedback{activeReview.due_date ? ` vóór ${new Date(activeReview.due_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}` : ""}.</p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-3.5 py-2 text-sm font-semibold">Review starten <ArrowRight size={14} /></span>
        </Link>
      )}

      {/* Deze week gebouwd - de wekelijkse drop (terugkeer-trigger) */}
      {showDrop && latestDrop && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-5 mb-5">
          <div className="flex items-center gap-2 text-blue text-xs font-semibold uppercase tracking-wide mb-2">
            <Sparkles size={14} /> Deze week gebouwd
          </div>
          <p className="text-base font-bold text-text">{latestDrop.title}</p>
          {latestDrop.body && <p className="text-sm text-text-secondary mt-1">{latestDrop.body}</p>}
          {latestDrop.link && (
            <a href={latestDrop.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text mt-3 no-underline hover:underline">
              <ExternalLink size={14} /> Bekijk het
            </a>
          )}
          <p className="text-[11px] text-text-muted mt-2">{new Date(latestDrop.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}</p>
        </div>
      )}

      {/* Oplevering - transparante kosten + betalen bij oplevering (Mollie) */}
      {openInvoice && (
        <div className="rounded-[12px] bg-bg-white border border-[#bfdbfe] p-5 mb-5">
          <div className="flex items-center gap-2 text-blue text-xs font-semibold uppercase tracking-wide mb-3">
            <CreditCard size={14} /> Oplevering: klaar om af te ronden
          </div>
          {openInvoice.description && <p className="text-sm text-text-secondary mb-3">{openInvoice.description}</p>}
          {costs.length > 0 ? (
            <div className="flex flex-col gap-1.5 mb-3">
              {costs.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-secondary min-w-0">
                    {c.description}
                    {c.is_overrun && <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-bg text-amber align-middle">Uitloop</span>}
                  </span>
                  <span className="text-text tabular-nums shrink-0">{formatCents(c.amount_cents)}</span>
                </div>
              ))}
            </div>
          ) : openInvoice.line_items?.length ? (
            <div className="flex flex-col gap-1.5 mb-3">
              {openInvoice.line_items.map((li, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{li.quantity > 1 ? `${li.quantity}× ` : ""}{li.description}</span>
                  <span className="text-text tabular-nums">{formatCents(li.price_cents * li.quantity)}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-border-light pt-3">
            <div>
              <p className="text-xs text-text-muted">Totaal · factuur {openInvoice.number}</p>
              <p className="text-lg font-bold text-text">{formatCents(openInvoice.amount_cents)}</p>
            </div>
            {openInvoice.mollie_payment_link_url ? (
              <a href={openInvoice.mollie_payment_link_url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline">
                Betalen <ArrowRight size={15} />
              </a>
            ) : (
              <Link to="/portal/facturen" className="shrink-0 inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline">
                Naar factuur <ArrowRight size={15} />
              </Link>
            )}
          </div>
          {monthlyTotal > 0 && (
            <p className="text-xs text-text-muted mt-2">Daarna: <span className="font-semibold text-text">{formatMonthly(monthlyTotal)}</span> voor je agents, vanaf het moment dat ze live staan.</p>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border-light mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const count = t.key === "modules" ? modules.length
            : t.key === "documenten" ? documents.length
            : t.key === "gesprekken" ? transcripts.length + meetings.length
            : 0;
          return (
            <button
              key={t.key}
              onClick={() => setSearchParams(t.key === "modules" ? {} : { tab: t.key })}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.key ? "border-text text-text" : "border-transparent text-text-muted hover:text-text"}`}
            >
              <t.icon size={15} /> {t.label}
              {count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-soft text-text-secondary">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* MODULES - het hart van het project voor de klant */}
      {tab === "modules" && (
        modules.length === 0 ? (
          <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
            <Boxes className="mx-auto mb-3 text-text-muted" size={26} />
            <p className="text-text font-medium mb-1">Nog geen modules</p>
            <p className="text-sm text-text-muted">Zodra we de onderdelen van jullie systeem klaarzetten, verschijnen ze hier.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((m) => {
              const st = MODULE_STATUS[m.status];
              const kind = normalizeModuleKind(m.kind);
              const Icon = moduleIcon(m.icon, kind);
              return (
                <Link key={m.id} to={`/portal/projecten/${id}/modules/${m.id}`}
                  className={`group rounded-[12px] bg-bg-white border p-5 no-underline hover:shadow-sm transition-all flex flex-col ${m.status === "live" ? "border-green-border" : "border-border-light hover:border-border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${kind === "agent" ? "bg-[#f3e8ff]" : "bg-accent-soft"}`}>
                      <Icon size={19} className={kind === "agent" ? "text-[#7c3aed]" : "text-text"} />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-text">{m.name}</p>
                    {kind === "agent" && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MODULE_KIND.agent.badge}`}>Agent</span>}
                  </div>
                  {m.description && <p className="text-xs text-text-muted mt-1 line-clamp-2">{m.description}</p>}
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary group-hover:text-text mt-3">
                    {kind === "agent" && m.monthly_price_cents != null ? <span className="text-[#7c3aed] font-semibold">{formatMonthly(m.monthly_price_cents)} vanaf live</span> : <>Bekijken <ChevronRight size={13} /></>}
                  </span>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* VOORTGANG */}
      {tab === "voortgang" && (
        <>
          <div className="mb-6"><ActivityFeed projectId={id!} /></div>

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

          {/* De route - alle stappen van het traject */}
          {steps.length > 0 && (
            <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text">De route</h2>
                <span className="text-xs text-text-muted">
                  {steps.filter((s) => s.status === "completed").length}/{steps.length} stappen
                </span>
              </div>
              <div className="flex flex-col">
                {steps.map((s, i) => {
                  const cfg = stepStatusConfig[s.status] ?? stepStatusConfig.pending;
                  const StepIcon = cfg.icon;
                  const last = i === steps.length - 1;
                  return (
                    <div key={s.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <StepIcon size={18} className={`${cfg.className} shrink-0`} />
                        {!last && <div className={`w-px flex-1 my-1 ${s.status === "completed" ? "bg-green/40" : "bg-border-light"}`} />}
                      </div>
                      <div className={`min-w-0 ${last ? "" : "pb-4"}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${s.status === "completed" ? "text-text-muted line-through" : "text-text"}`}>{s.title}</p>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${s.owner === "client" ? "bg-blue-bg text-blue" : "bg-accent-soft text-text-muted"}`}>
                            {s.owner === "client" ? "Jullie" : "Studio"}
                          </span>
                          {s.status === "in_progress" && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-bg text-blue">Nu bezig</span>}
                        </div>
                        {s.description && <p className="text-xs text-text-muted mt-0.5">{s.description}</p>}
                        {s.due_date && s.status !== "completed" && (
                          <p className="text-[11px] text-text-muted mt-0.5">Streefdatum {new Date(s.due_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Volgende stap: agents - de ladder trekt vooruit na oplevering */}
          {showAgentTeaser && (
            <div className="flex items-center gap-2.5 rounded-[12px] border border-dashed border-border px-5 py-3.5 mb-6">
              <Sparkles size={15} className="text-[#7c3aed] shrink-0" />
              <p className="text-sm text-text-secondary">Volgende stap: <span className="font-semibold text-text">agents op jullie systeem</span> — die doen het werk zelf. We vertellen je er graag over.</p>
            </div>
          )}

          {/* Kosten - altijd transparant tijdens het project, betalen pas bij oplevering */}
          {costs.length > 0 && (
            <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text">Kosten</h2>
                <span className="text-xs text-text-muted">Je betaalt pas bij oplevering</span>
              </div>
              <div className="flex flex-col divide-y divide-border-light">
                {costs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0">
                    <span className="text-text-secondary min-w-0">
                      {c.description}
                      {c.is_overrun && <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-bg text-amber align-middle">Uitloop</span>}
                    </span>
                    <span className="text-text tabular-nums shrink-0">{formatCents(c.amount_cents)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 pt-3 text-sm font-semibold">
                  <span className="text-text">
                    Totaal
                    {costs.some((c) => c.is_overrun) && (
                      <span className="font-normal text-text-muted"> (waarvan {formatCents(costs.filter((c) => c.is_overrun).reduce((s, c) => s + c.amount_cents, 0))} uitloop)</span>
                    )}
                  </span>
                  <span className="text-text tabular-nums">{formatCents(costs.reduce((s, c) => s + c.amount_cents, 0))}</span>
                </div>
              </div>
              {monthlyTotal > 0 && (
                <div className="mt-3 pt-3 border-t border-border-light">
                  {agentModules.filter((m) => m.monthly_price_cents != null).map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                      <span className="text-text-secondary">{m.name} <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f3e8ff] text-[#7c3aed] align-middle">Agent</span></span>
                      <span className="text-text tabular-nums">{formatMonthly(m.monthly_price_cents!)}</span>
                    </div>
                  ))}
                  <p className="text-xs text-text-muted mt-1.5">Maandelijks, pas vanaf het moment dat de agent live staat.</p>
                </div>
              )}
            </div>
          )}

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
                  <div key={u.id} className={`border-l-2 pl-4 py-1 ${u.kind === "drop" ? "border-blue" : "border-border-light"}`}>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">{u.title}</p>
                      {u.kind === "drop" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-bg text-blue">DROP</span>}
                    </div>
                    {u.body && <p className="text-sm text-text-secondary mt-1">{u.body}</p>}
                    {u.link && <a href={u.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline no-underline">Bekijk link →</a>}
                    <p className="text-xs text-text-muted mt-1">{new Date(u.created_at).toLocaleDateString("nl-NL")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
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

      {/* INTAKE (alleen de brief) */}
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

      {/* GESPREKKEN (transcripts + meetings) */}
      {tab === "gesprekken" && (
        <div className="flex flex-col gap-4">
          {/* Meetings */}
          <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4"><Calendar size={14} /> Afspraken</h2>
            {meetings.length === 0 ? (
              <p className="text-sm text-text-muted">Nog geen afspraken ingepland.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {meetings.map((m) => {
                  const isUpcoming = m.status === "planned" && new Date(m.scheduled_at) >= new Date();
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-[8px] border border-border-light">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                          {isUpcoming ? <CalendarClock size={16} className="text-blue" /> : <Calendar size={16} className="text-text-muted" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text truncate">{m.title}</p>
                          <p className="text-xs text-text-muted">
                            {new Date(m.scheduled_at).toLocaleString("nl-NL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                            {m.status === "completed" && " · afgerond"}
                            {m.status === "reschedule_requested" && " · verzetten aangevraagd"}
                          </p>
                          {m.outcome && <p className="text-xs text-text-secondary mt-1">{m.outcome}</p>}
                        </div>
                      </div>
                      {isUpcoming && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => downloadICS(m)} className="inline-flex items-center gap-1.5 text-xs font-medium bg-text text-white rounded-[8px] px-2.5 py-1.5"><CalendarPlus size={13} /> Agenda</button>
                          <a href={googleCalendarUrl(m)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-text-secondary hover:text-text no-underline">Google</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transcripts */}
          <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4"><ListTree size={14} /> Gespreksverslagen</h2>
            {transcripts.length === 0 ? (
              <p className="text-sm text-text-muted">Nog geen gespreksverslagen. Deze verschijnen zodra we een gesprek toevoegen.</p>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

function IntakeField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm ${value ? "text-text" : "text-text-muted italic"} whitespace-pre-wrap`}>{value || "Niet ingevuld"}</p>
    </div>
  );
}
