import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  ListChecks,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/notifications";
import type {
  DiscoveryBrief,
  Invoice,
  Meeting,
  Notification,
  ReviewRound,
  WorkflowStep,
} from "@/types/portal";

interface ReviewWithProject extends ReviewRound {
  projects: { title: string; id: string } | null;
}

interface NextAction {
  id: string;
  icon: typeof Eye;
  title: string;
  subtitle: string;
  to: string;
  cta: string;
  tone: "blue" | "amber" | "neutral";
}

export function Dashboard() {
  const { profile, user } = useAuth();
  const { activeClientId } = useActiveClient();
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [reviews, setReviews] = useState<ReviewWithProject[]>([]);
  const [clientSteps, setClientSteps] = useState<WorkflowStep[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [openInvoices, setOpenInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !activeClientId) return;
    async function load() {
      const [briefs, reviewsRes, stepsRes, meetingsRes, invoicesRes, notifs] =
        await Promise.all([
          supabase
            .from("discovery_briefs")
            .select("*")
            .eq("client_id", activeClientId!)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("review_rounds")
            .select("*, projects!inner(id, title, client_id)")
            .eq("projects.client_id", activeClientId!)
            .in("status", ["pending", "active"])
            .order("created_at", { ascending: false }),
          supabase
            .from("workflow_steps")
            .select("*")
            .eq("client_id", activeClientId!)
            .eq("owner", "client")
            .in("status", ["pending", "in_progress"])
            .order("sequence_order"),
          supabase
            .from("meetings")
            .select("*")
            .eq("client_id", activeClientId!)
            .eq("status", "planned")
            .gte("scheduled_at", new Date().toISOString())
            .order("scheduled_at")
            .limit(3),
          supabase
            .from("invoices")
            .select("*")
            .eq("client_id", activeClientId!)
            .eq("status", "verstuurd")
            .order("created_at", { ascending: false }),
          fetchNotifications(8),
        ]);

      setBrief((briefs.data?.[0] as DiscoveryBrief) ?? null);
      setReviews((reviewsRes.data as ReviewWithProject[]) ?? []);
      setClientSteps((stepsRes.data as WorkflowStep[]) ?? []);
      setMeetings((meetingsRes.data as Meeting[]) ?? []);
      setOpenInvoices((invoicesRes.data as Invoice[]) ?? []);
      setNotifications(notifs);
    }
    load();
  }, [user, activeClientId]);

  const nextActions = useMemo<NextAction[]>(() => {
    const actions: NextAction[] = [];

    // Intake hervatten / starten
    if (!brief || brief.status === "draft") {
      const step = brief?.current_step ?? 0;
      actions.push({
        id: "intake",
        icon: Sparkles,
        title: brief ? "Maak je intake af" : "Start je intake",
        subtitle: brief ? `Je was bij stap ${step + 1} van 8` : "Vertel ons over jullie bedrijf",
        to: "/portal/discovery",
        cta: brief ? "Hervatten" : "Starten",
        tone: "blue",
      });
    }

    // Openstaande reviews
    for (const rev of reviews) {
      actions.push({
        id: `review-${rev.id}`,
        icon: Eye,
        title: `Review: ${rev.title}`,
        subtitle: rev.due_date
          ? `${rev.projects?.title ?? "Project"} · feedback vóór ${fmt(rev.due_date)}`
          : rev.projects?.title ?? "Bekijk de preview en geef feedback",
        to: `/portal/projecten/${rev.project_id}/review/${rev.id}`,
        cta: "Review starten",
        tone: "blue",
      });
    }

    // Eigen workflow-stappen
    for (const step of clientSteps) {
      actions.push({
        id: `step-${step.id}`,
        icon: ListChecks,
        title: step.title,
        subtitle: step.due_date ? `Jullie actie · vóór ${fmt(step.due_date)}` : "Jullie actie",
        to: "/portal/traject",
        cta: "Bekijken",
        tone: "amber",
      });
    }

    // Komende meeting
    for (const mt of meetings) {
      actions.push({
        id: `meeting-${mt.id}`,
        icon: Calendar,
        title: mt.title,
        subtitle: `Afspraak · ${fmtDateTime(mt.scheduled_at)}`,
        to: "/portal/meetings",
        cta: "Details",
        tone: "neutral",
      });
    }

    // Openstaande factuur
    for (const inv of openInvoices) {
      actions.push({
        id: `invoice-${inv.id}`,
        icon: CreditCard,
        title: `Factuur ${inv.number}`,
        subtitle: `${formatCents(inv.amount_cents)} · openstaand`,
        to: "/portal/facturen",
        cta: "Betalen",
        tone: "amber",
      });
    }

    return actions;
  }, [brief, reviews, clientSteps, meetings, openInvoices]);

  const unread = notifications.filter((n) => !n.read_at);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">
          Welkom terug, {profile?.full_name?.split(" ")[0] || "daar"}
        </h1>
        <Link
          to="/portal/traject"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary no-underline hover:text-text"
        >
          <RouteIcon size={16} /> Jouw traject
        </Link>
      </div>

      {/* Volgende acties */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-lg font-semibold text-text mb-4">Je volgende stappen</h2>
        {nextActions.length === 0 ? (
          <div className="flex items-center gap-3 text-text-secondary">
            <CheckCircle2 size={18} className="text-green" />
            <p className="text-sm">Je bent helemaal bij. We laten het weten zodra er iets voor je klaarstaat.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {nextActions.map((a) => (
              <Link
                key={a.id}
                to={a.to}
                className={`flex items-center justify-between gap-4 p-4 rounded-[10px] border no-underline transition-shadow hover:shadow-xs ${
                  a.tone === "blue" ? "bg-blue-bg border-[#bfdbfe]"
                  : a.tone === "amber" ? "bg-amber-bg border-amber-border"
                  : "bg-bg border-border-light"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <a.icon size={18} className="text-text shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{a.title}</p>
                    <p className="text-xs text-text-muted truncate">{a.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-text">
                  {a.cta} <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Wat is er nieuw */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Bell size={18} /> Wat is er nieuw
            {unread.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {unread.length}
              </span>
            )}
          </h2>
          {unread.length > 0 && (
            <button
              onClick={async () => {
                await markAllNotificationsRead();
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
                );
              }}
              className="text-xs font-medium text-text-muted hover:text-text"
            >
              Alles gelezen
            </button>
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
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {new Date(n.created_at).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} className="no-underline hover:bg-bg -mx-2 px-2 rounded">
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}
