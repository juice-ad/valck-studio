import { supabase } from "./supabase";
import type { Notification } from "@/types/portal";

/**
 * In-app meldingen. De klant wordt hiermee door zijn traject geleid:
 * review klaar, feedback beantwoord, fase gewijzigd, meeting gepland.
 */

export async function fetchNotifications(limit = 20): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Notification[]) ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}

interface NotifyInput {
  userId: string;
  clientId?: string | null;
  type: string;
  title: string;
  body?: string;
  link?: string;
}

/**
 * Maak een melding aan voor een specifieke gebruiker. Alleen admins mogen
 * dit (RLS): gebruikt bij events als "review klaar" of "feedback beantwoord".
 */
export async function createNotification(input: NotifyInput): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: input.userId,
    client_id: input.clientId ?? null,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });
}

/**
 * Stuur een melding naar alle leden van een client (bijv. Niklas én Paul).
 * Zoekt de user-ids op via user_client_memberships.
 */
export async function notifyClientMembers(
  clientId: string,
  notif: Omit<NotifyInput, "userId" | "clientId">
): Promise<void> {
  const { data: members } = await supabase
    .from("user_client_memberships")
    .select("user_id")
    .eq("client_id", clientId);

  if (!members || members.length === 0) return;

  const rows = members.map((m: { user_id: string }) => ({
    user_id: m.user_id,
    client_id: clientId,
    type: notif.type,
    title: notif.title,
    body: notif.body ?? null,
    link: notif.link ?? null,
  }));

  await supabase.from("notifications").insert(rows);
}
