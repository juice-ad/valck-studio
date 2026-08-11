import { supabase } from "./supabase";

export type ActivityKind = "update" | "review" | "meeting" | "reply";

export interface ActivityItem {
  id: string;
  at: string;
  title: string;
  subtitle?: string;
  link?: string;
  kind: ActivityKind;
}

/**
 * Voedt de "Sinds je laatste bezoek"-feed op het klant-overzicht.
 * Bewust afgeleid van bestaande tabellen (geen nieuwe data): project-updates
 * (incl. fase- en module-statuswijzigingen), review-rondes, afspraken en
 * beantwoorde feedback. Geeft de laatste ~12 gebeurtenissen, nieuw→oud.
 */
export async function fetchActivity(projectId: string): Promise<ActivityItem[]> {
  const [upd, rev, mt, fb] = await Promise.all([
    supabase.from("project_updates").select("id, title, body, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(15),
    supabase.from("review_rounds").select("id, title, week_number, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(10),
    supabase.from("meetings").select("id, title, scheduled_at, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(10),
    supabase.from("preview_feedback").select("id, admin_response, responded_at").eq("project_id", projectId).not("admin_response", "is", null).order("responded_at", { ascending: false }).limit(10),
  ]);

  const items: ActivityItem[] = [];
  for (const u of upd.data ?? []) items.push({ id: `u${u.id}`, at: u.created_at, title: u.title, subtitle: u.body ?? undefined, kind: "update" });
  for (const r of rev.data ?? []) items.push({ id: `r${r.id}`, at: r.created_at, title: `Nieuwe klik-ronde: ${r.title}`, subtitle: `Week ${r.week_number}`, link: `/portal/projecten/${projectId}/review/${r.id}`, kind: "review" });
  for (const m of mt.data ?? []) items.push({ id: `m${m.id}`, at: m.created_at, title: `Afspraak: ${m.title}`, subtitle: new Date(m.scheduled_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), kind: "meeting" });
  for (const f of fb.data ?? []) if (f.responded_at) items.push({ id: `f${f.id}`, at: f.responded_at, title: "De studio reageerde op je feedback", link: "/portal/project", kind: "reply" });

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, 12);
}
