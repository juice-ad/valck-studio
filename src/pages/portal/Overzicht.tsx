import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Bell, Calendar, CalendarPlus, CheckCircle2, Circle, CreditCard,
  Eye, Flag, ListChecks, MessageSquare, Sparkles, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { downloadICS, googleCalendarUrl } from "@/lib/ics";
import { WelcomeOverlay } from "@/components/portal/WelcomeOverlay";
import type {
  Project, ProjectPhase, WorkflowStep, ReviewRound, Meeting, ProjectUpdate,
  DiscoveryBrief, Invoice, Notification,
} from "@/types/portal";

const PHASES: { key: ProjectPhase; label: string; blurb: string }[] = [
  { key: "discovery", label: "Ontdekken", blurb: "We leren jullie bedrijf kennen en bepalen de scope." },
  { key: "build", label: "Bouwen", blurb: "We bouwen de eerste module, elke week een klik-ronde." },
  { key: "scale", label: "Uitbouwen", blurb: "We zetten modules aan en optimaliseren." },
  { key: "completed", label: "Afgerond", blurb: "Het systeem draait en is van jullie." },
];

type TimelineKind = "step" | "review" | "meeting" | "update";
interface TimelineItem {
  id: string; kind: TimelineKind; date: string; title: string;
  subtitle?: string; status: "done" | "active" | "upcoming" | "blocked";
  link?: string; ownerBadge?: string;
}
interface NextAction {
  id: string; icon: typeof Eye; title: string; subtitle: string;
  to: string; cta: string; tone: "blue" | "amber" | "neutral";
}

export function Overzicht() {
  const { profile } = useAuth();
  const { activeClientId } = useActiveClient();
  const [showWelcome, setShowWelcome] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [reviews, setReviews] = useState<ReviewRound[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [openInvoices, setOpenInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClientId) return;
    async function load() {
      const [projRes, briefRes, invRes, notifs] = await Promise.all([
        supabase.from("projects").select("*").eq("client_id", activeClientId!).order("created_at", { ascending: false }).limit(1),
        supabase.from("discovery_briefs").select("*").eq("client_id", activeClientId!).order("created_at", { ascending: false }).limit(1),
        supabase.from("invoices").select("*").eq("client_id", activeClientId!).eq("status", "verstuurd").order("created_at", { ascending: false }),
        fetchNotifications(8),
      ]);
      const proj = (projRes.data?.[0] as Project) ?? null;
      setProject(proj);
      setBrief((briefRes.data?.[0] as DiscoveryBrief) ?? null);
      setOpenInvoices((invRes.data as Invoice[]) ?? []);
      setNotifications(notifs);

      if (proj) {
        const [s, r, u] = await Promise.all([
          supabase.from("workflow_steps").select("*").eq("project_id", proj.id).order("sequence_order"),
          supabase.from("review_rounds").select("*").eq("project_id", proj.id).order("week_number"),
          supabase.from("project_updates").select("*").eq("project_id", proj.id).order("created_at", { ascending: false }).limit(6),
        ]);
        setSteps((s.data as WorkflowStep[]) ?? []);
        setReviews((r.data as ReviewRound[]) ?? []);
        setUpdates((u.data as ProjectUpdate[]) ?? []);
      }
      const m = await supabase.from("meetings").select("*").eq("client_id", activeClientId!).order("scheduled_at");
      setMeetings((m.data as Meeting[]) ?? []);
      setLoading(false);
    }
    load();
  }, [activeClientId]);

  useEffect(() => {
    if (profile && profile.role === "client" && !profile.onboarded_at) setShowWelcome(true);
  }, [profile]);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!project) return [];
    const items: TimelineItem[] = [];
    for (const step of steps) {
      items.push({
        id: `step-${step.id}`, kind: "step", date: step.due_date ?? step.created_at,
        title: step.title, subtitle: step.description ?? undefined,
        status: step.status === "completed" ? "done" : step.status === "in_progress" ? "active" : step.status === "blocked" ? "blocked" : "upcoming",
        ownerBadge: step.owner === "client" ? "Jullie actie" : "Studio",
      });
    }
    for (const rev of reviews) {
      items.push({
        id: `review-${rev.id}`, kind: "review", date: rev.start_date ?? rev.created_at,
        title: rev.title, subtitle: rev.due_date ? `Review, feedback vóór ${fmt(rev.due_date)}` : "Klik-ronde",
        status: rev.status === "completed" ? "done" : rev.status === "active" ? "active" : "upcoming",
        link: `/portal/projecten/${project.id}/review/${rev.id}`,
      });
    }
    for (const mt of meetings) {
      const past = new Date(mt.scheduled_at) < new Date();
      items.push({
        id: `meeting-${mt.id}`, kind: "meeting", date: mt.scheduled_at,
        title: mt.title, subtitle: `Afspraak · ${fmtDateTime(mt.scheduled_at)}`,
        status: mt.status === "completed" ? "done" : past ? "active" : "upcoming",
      });
    }
    for (const up of updates) {
      items.push({ id: `update-${up.id}`, kind: "update", date: up.created_at, title: up.title, subtitle: up.body ?? "Update van de studio", status: "done" });
    }
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [project, steps, reviews, meetings, updates]);

  const nextItem = useMemo(() => timeline.find((i) => i.status === "active" || i.status === "upcoming"), [timeline]);

  const nextActions = useMemo<NextAction[]>(() => {
    const a: NextAction[] = [];
    if (!brief || brief.status === "draft") {
      a.push({ id: "intake", icon: Sparkles, title: brief ? "Maak je intake af" : "Start je intake",
        subtitle: brief ? `Je was bij stap ${(brief.current_step ?? 0) + 1} van 8` : "Vertel ons over jullie bedrijf",
        to: "/portal/discovery", cta: brief ? "Hervatten" : "Starten", tone: "blue" });
    }
    for (const rev of reviews.filter((r) => r.status === "pending" || r.status === "active")) {
      a.push({ id: `rev-${rev.id}`, icon: Eye, title: `Review: ${rev.title}`,
        subtitle: rev.due_date ? `Feedback vóór ${fmt(rev.due_date)}` : "Bekijk de preview en geef feedback",
        to: project ? `/portal/projecten/${project.id}/review/${rev.id}` : "/portal/project", cta: "Review starten", tone: "blue" });
    }
    for (const step of steps.filter((s) => s.owner === "client" && (s.status === "pending" || s.status === "in_progress"))) {
      a.push({ id: `st-${step.id}`, icon: ListChecks, title: step.title,
        subtitle: step.due_date ? `Jullie actie · vóór ${fmt(step.due_date)}` : "Jullie actie", to: "/portal/overzicht", cta: "Bekijken", tone: "amber" });
    }
    for (const inv of openInvoices) {
      a.push({ id: `inv-${inv.id}`, icon: CreditCard, title: `Factuur ${inv.number}`, subtitle: `${formatCents(inv.amount_cents)} · openstaand`, to: "/portal/facturen", cta: "Betalen", tone: "amber" });
    }
    return a;
  }, [brief, reviews, steps, openInvoices, project]);

  const stepProgress = useMemo(() => {
    if (steps.length === 0) return null;
    const done = steps.filter((s) => s.status === "completed").length;
    return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
  }, [steps]);

  const phaseIndex = project ? PHASES.findIndex((p) => p.key === project.phase) : -1;
  const upcomingMeetings = meetings.filter((m) => new Date(m.scheduled_at) >= new Date() && m.status !== "cancelled" && m.status !== "completed").slice(0, 2);
  const unread = notifications.filter((n) => !n.read_at);

  if (loading) return <p className="text-sm text-text-muted">Je overzicht wordt geladen…</p>;

  return (
    <div className="max-w-3xl">
      {showWelcome && <WelcomeOverlay onDone={() => setShowWelcome(false)} />}
      <h1 className="text-2xl font-bold text-text mb-1">
        Welkom terug, {profile?.full_name?.split(" ")[0] || "daar"}
      </h1>
      {project && <p className="text-text-secondary mb-6">{project.title}</p>}

      {/* Volgende stappen */}
      {nextActions.length > 0 && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">Je volgende stappen</h2>
          <div className="flex flex-col gap-2.5">
            {nextActions.map((a) => (
              <Link key={a.id} to={a.to}
                className={`flex items-center justify-between gap-4 p-4 rounded-[10px] border no-underline transition-shadow hover:shadow-xs ${
                  a.tone === "blue" ? "bg-blue-bg border-[#bfdbfe]" : a.tone === "amber" ? "bg-amber-bg border-amber-border" : "bg-bg border-border-light"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <a.icon size={18} className="text-text shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{a.title}</p>
                    <p className="text-xs text-text-muted truncate">{a.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-text">{a.cta} <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Geen project: naar intake */}
      {!project && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center mb-6">
          <Sparkles className="mx-auto mb-3 text-text-muted" size={28} />
          <p className="text-text font-medium mb-1">Jullie traject begint bij de intake</p>
          <p className="text-sm text-text-muted mb-5">Vertel ons over jullie bedrijf, dan zetten we samen de eerste stappen uit.</p>
          <Link to="/portal/discovery" className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline">
            Start de intake <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {project && (
        <>
          {/* Fase-stepper */}
          <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              {PHASES.map((p, i) => {
                const done = i < phaseIndex; const current = i === phaseIndex;
                return (
                  <div key={p.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-green text-white" : current ? "bg-text text-white" : "bg-accent-soft text-text-muted"}`}>
                        {done ? <CheckCircle2 size={16} /> : i + 1}
                      </div>
                      <span className={`text-[11px] mt-1.5 ${current ? "text-text font-medium" : "text-text-muted"}`}>{p.label}</span>
                    </div>
                    {i < PHASES.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${i < phaseIndex ? "bg-green" : "bg-border-light"}`} />}
                  </div>
                );
              })}
            </div>
            {phaseIndex >= 0 && <p className="text-sm text-text-secondary">{PHASES[phaseIndex].blurb}</p>}
            {stepProgress && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                  <span>Voortgang</span><span>{stepProgress.done}/{stepProgress.total} stappen</span>
                </div>
                <div className="h-2 rounded-full bg-accent-soft overflow-hidden">
                  <div className="h-full bg-text rounded-full transition-all" style={{ width: `${stepProgress.pct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Nu aan de beurt */}
          {nextItem && (
            <div className="rounded-[12px] bg-blue-bg border border-[#bfdbfe] p-5 mb-6">
              <div className="flex items-center gap-2 text-blue text-xs font-semibold uppercase tracking-wide mb-2"><Flag size={14} /> Nu aan de beurt</div>
              <p className="text-text font-semibold">{nextItem.title}</p>
              {nextItem.subtitle && <p className="text-sm text-text-secondary mt-0.5">{nextItem.subtitle}</p>}
              {nextItem.link && <Link to={nextItem.link} className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue no-underline">Bekijken <ArrowRight size={15} /></Link>}
            </div>
          )}

          {/* De route */}
          <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
            <h2 className="text-lg font-semibold text-text mb-5">De route</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-text-muted">De eerste stappen komen er zo aan.</p>
            ) : (
              <ol className="relative">
                {timeline.map((item, i) => (
                  <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < timeline.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border-light" />}
                    <TimelineDot kind={item.kind} status={item.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {item.link ? (
                            <Link to={item.link} className="text-sm font-medium text-text no-underline hover:underline">{item.title}</Link>
                          ) : <p className="text-sm font-medium text-text">{item.title}</p>}
                          {item.subtitle && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.subtitle}</p>}
                        </div>
                        {item.ownerBadge && (
                          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${item.ownerBadge === "Jullie actie" ? "bg-amber-bg text-amber" : "bg-accent-soft text-text-secondary"}`}>{item.ownerBadge}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">{fmtSmart(item.date)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Komende afspraken */}
          {upcomingMeetings.length > 0 && (
            <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2"><Calendar size={18} /> Komende afspraken</h2>
              <div className="flex flex-col gap-3">
                {upcomingMeetings.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 p-3 rounded-[8px] border border-border-light">
                    <div>
                      <p className="text-sm font-medium text-text">{m.title}</p>
                      <p className="text-xs text-text-muted">{new Date(m.scheduled_at).toLocaleString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => downloadICS(m)} className="inline-flex items-center gap-1.5 text-xs font-medium bg-text text-white rounded-[8px] px-2.5 py-1.5"><CalendarPlus size={14} /> Agenda</button>
                      <a href={googleCalendarUrl(m)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-text-secondary hover:text-text no-underline">Google</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Wat is er nieuw */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Bell size={18} /> Wat is er nieuw
            {unread.length > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{unread.length}</span>}
          </h2>
          {unread.length > 0 && (
            <button onClick={async () => { await markAllNotificationsRead(); setNotifications((p) => p.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))); }}
              className="text-xs font-medium text-text-muted hover:text-text">Alles gelezen</button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-text-muted">Nog geen meldingen.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border-light">
            {notifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 py-3">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read_at ? "bg-border-light" : "bg-blue"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{n.title}</p>
                    {n.body && <p className="text-xs text-text-muted mt-0.5">{n.body}</p>}
                    <p className="text-[11px] text-text-muted mt-0.5">{new Date(n.created_at).toLocaleDateString("nl-NL")}</p>
                  </div>
                </div>
              );
              return n.link ? <Link key={n.id} to={n.link} className="no-underline hover:bg-bg -mx-2 px-2 rounded">{inner}</Link> : <div key={n.id}>{inner}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineDot({ kind, status }: { kind: TimelineKind; status: TimelineItem["status"] }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10";
  if (status === "done") return <div className={`${base} bg-green-bg text-green`}><CheckCircle2 size={16} /></div>;
  if (status === "blocked") return <div className={`${base} bg-amber-bg text-amber`}><AlertTriangle size={16} /></div>;
  if (status === "active") return <div className={`${base} bg-text text-white`}>{iconFor(kind)}</div>;
  return <div className={`${base} bg-accent-soft text-text-muted`}>{iconFor(kind)}</div>;
}
function iconFor(kind: TimelineKind) {
  if (kind === "review") return <Eye size={15} />;
  if (kind === "meeting") return <Calendar size={15} />;
  if (kind === "update") return <MessageSquare size={15} />;
  return <Circle size={15} />;
}
function fmt(d: string) { return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }); }
function fmtDateTime(d: string) { return new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
function fmtSmart(d: string) { return d.includes("T") ? fmtDateTime(d) : fmt(d); }
function formatCents(cents: number) { return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }); }
