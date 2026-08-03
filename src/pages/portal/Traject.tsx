import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  Flag,
  MessageSquare,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomeOverlay } from "@/components/portal/WelcomeOverlay";
import type {
  Project,
  ProjectPhase,
  WorkflowStep,
  ReviewRound,
  Meeting,
  ProjectUpdate,
} from "@/types/portal";

const PHASES: { key: ProjectPhase; label: string; blurb: string }[] = [
  { key: "discovery", label: "Ontdekken", blurb: "We leren jullie bedrijf kennen en bepalen de scope." },
  { key: "build", label: "Bouwen", blurb: "We bouwen de eerste module, elke week een klik-ronde." },
  { key: "scale", label: "Uitbouwen", blurb: "We zetten modules aan en optimaliseren." },
  { key: "completed", label: "Afgerond", blurb: "Het systeem draait en is van jullie." },
];

type TimelineKind = "step" | "review" | "meeting" | "update";

interface TimelineItem {
  id: string;
  kind: TimelineKind;
  date: string; // ISO of yyyy-mm-dd
  title: string;
  subtitle?: string;
  status: "done" | "active" | "upcoming" | "blocked";
  link?: string;
  ownerBadge?: string;
}

export function Traject() {
  const { activeClientId } = useActiveClient();
  const { profile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [reviews, setReviews] = useState<ReviewRound[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClientId) return;
    async function load() {
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", activeClientId!)
        .order("created_at", { ascending: false })
        .limit(1);
      const proj = (projects?.[0] as Project) ?? null;
      setProject(proj);

      if (proj) {
        const [s, r, m, u] = await Promise.all([
          supabase.from("workflow_steps").select("*").eq("project_id", proj.id).order("sequence_order"),
          supabase.from("review_rounds").select("*").eq("project_id", proj.id).order("week_number"),
          supabase.from("meetings").select("*").eq("project_id", proj.id).order("scheduled_at"),
          supabase.from("project_updates").select("*").eq("project_id", proj.id).order("created_at", { ascending: false }).limit(6),
        ]);
        setSteps((s.data as WorkflowStep[]) ?? []);
        setReviews((r.data as ReviewRound[]) ?? []);
        setMeetings((m.data as Meeting[]) ?? []);
        setUpdates((u.data as ProjectUpdate[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, [activeClientId]);

  useEffect(() => {
    if (profile && profile.role === "client" && !profile.onboarded_at) {
      setShowWelcome(true);
    }
  }, [profile]);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!project) return [];
    const items: TimelineItem[] = [];

    for (const step of steps) {
      items.push({
        id: `step-${step.id}`,
        kind: "step",
        date: step.due_date ?? step.created_at,
        title: step.title,
        subtitle: step.description ?? undefined,
        status:
          step.status === "completed" ? "done"
          : step.status === "in_progress" ? "active"
          : step.status === "blocked" ? "blocked"
          : "upcoming",
        ownerBadge: step.owner === "client" ? "Jullie actie" : "Studio",
      });
    }
    for (const rev of reviews) {
      items.push({
        id: `review-${rev.id}`,
        kind: "review",
        date: rev.start_date ?? rev.created_at,
        title: `${rev.title}`,
        subtitle: rev.due_date ? `Review, feedback vóór ${fmt(rev.due_date)}` : "Klik-ronde",
        status: rev.status === "completed" ? "done" : rev.status === "active" ? "active" : "upcoming",
        link: `/portal/projecten/${project.id}/review/${rev.id}`,
      });
    }
    for (const mt of meetings) {
      const past = new Date(mt.scheduled_at) < new Date();
      items.push({
        id: `meeting-${mt.id}`,
        kind: "meeting",
        date: mt.scheduled_at,
        title: mt.title,
        subtitle: `Afspraak · ${fmtDateTime(mt.scheduled_at)}`,
        status: mt.status === "completed" ? "done" : past ? "active" : "upcoming",
        link: "/portal/meetings",
      });
    }
    for (const up of updates) {
      items.push({
        id: `update-${up.id}`,
        kind: "update",
        date: up.created_at,
        title: up.title,
        subtitle: up.body ?? "Update van de studio",
        status: "done",
      });
    }

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [project, steps, reviews, meetings, updates]);

  const nextItem = useMemo(
    () => timeline.find((i) => i.status === "active" || i.status === "upcoming"),
    [timeline]
  );

  const stepProgress = useMemo(() => {
    if (steps.length === 0) return null;
    const done = steps.filter((s) => s.status === "completed").length;
    return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
  }, [steps]);

  const phaseIndex = project ? PHASES.findIndex((p) => p.key === project.phase) : -1;

  if (loading) {
    return <p className="text-sm text-text-muted">Je traject wordt geladen…</p>;
  }

  if (!project) {
    return (
      <div>
        {showWelcome && <WelcomeOverlay onDone={() => setShowWelcome(false)} />}
        <h1 className="text-2xl font-bold text-text mb-2">Jouw traject</h1>
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center mt-6">
          <Sparkles className="mx-auto mb-3 text-text-muted" size={28} />
          <p className="text-text font-medium mb-1">Je traject begint bij de intake</p>
          <p className="text-sm text-text-muted mb-5">
            Vertel ons over jullie bedrijf, dan zetten we samen de eerste stappen uit.
          </p>
          <Link
            to="/portal/discovery"
            className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline"
          >
            Start de intake <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {showWelcome && <WelcomeOverlay onDone={() => setShowWelcome(false)} />}
      <h1 className="text-2xl font-bold text-text mb-1">Jouw traject</h1>
      <p className="text-text-secondary mb-6">{project.title}</p>

      {/* Fase-stepper */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          {PHASES.map((p, i) => {
            const done = i < phaseIndex;
            const current = i === phaseIndex;
            return (
              <div key={p.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      done ? "bg-green text-white"
                      : current ? "bg-text text-white"
                      : "bg-accent-soft text-text-muted"
                    }`}
                  >
                    {done ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span className={`text-[11px] mt-1.5 ${current ? "text-text font-medium" : "text-text-muted"}`}>
                    {p.label}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${i < phaseIndex ? "bg-green" : "bg-border-light"}`} />
                )}
              </div>
            );
          })}
        </div>
        {phaseIndex >= 0 && (
          <p className="text-sm text-text-secondary">{PHASES[phaseIndex].blurb}</p>
        )}
        {stepProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
              <span>Voortgang</span>
              <span>{stepProgress.done}/{stepProgress.total} stappen</span>
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
          <div className="flex items-center gap-2 text-blue text-xs font-semibold uppercase tracking-wide mb-2">
            <Flag size={14} /> Nu aan de beurt
          </div>
          <p className="text-text font-semibold">{nextItem.title}</p>
          {nextItem.subtitle && <p className="text-sm text-text-secondary mt-0.5">{nextItem.subtitle}</p>}
          {nextItem.link && (
            <Link
              to={nextItem.link}
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue no-underline"
            >
              Bekijken <ArrowRight size={15} />
            </Link>
          )}
        </div>
      )}

      {/* De tijdlijn */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        <h2 className="text-lg font-semibold text-text mb-5">De route</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-text-muted">De eerste stappen komen er zo aan.</p>
        ) : (
          <ol className="relative">
            {timeline.map((item, i) => (
              <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < timeline.length - 1 && (
                  <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border-light" />
                )}
                <TimelineDot kind={item.kind} status={item.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {item.link ? (
                        <Link to={item.link} className="text-sm font-medium text-text no-underline hover:underline">
                          {item.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-text">{item.title}</p>
                      )}
                      {item.subtitle && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.subtitle}</p>
                      )}
                    </div>
                    {item.ownerBadge && (
                      <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        item.ownerBadge === "Jullie actie" ? "bg-amber-bg text-amber" : "bg-accent-soft text-text-secondary"
                      }`}>
                        {item.ownerBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">{fmtSmart(item.date)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function TimelineDot({ kind, status }: { kind: TimelineKind; status: TimelineItem["status"] }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10";
  if (status === "done")
    return <div className={`${base} bg-green-bg text-green`}><CheckCircle2 size={16} /></div>;
  if (status === "blocked")
    return <div className={`${base} bg-amber-bg text-amber`}><AlertTriangle size={16} /></div>;
  if (status === "active")
    return <div className={`${base} bg-text text-white`}>{iconFor(kind)}</div>;
  return <div className={`${base} bg-accent-soft text-text-muted`}>{iconFor(kind)}</div>;
}

function iconFor(kind: TimelineKind) {
  const size = 15;
  if (kind === "review") return <Eye size={size} />;
  if (kind === "meeting") return <Calendar size={size} />;
  if (kind === "update") return <MessageSquare size={size} />;
  return <Circle size={size} />;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtSmart(d: string) {
  const hasTime = d.includes("T");
  return hasTime ? fmtDateTime(d) : fmt(d);
}
