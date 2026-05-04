import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Message } from "@/types/portal";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeMessagesOptions {
  /** Filter messages by sender_id or is_from_studio (portal) */
  userId?: string;
  /** Filter by client_id for admin view */
  clientId?: string;
  /** Filter by project_id (null = general channel) */
  projectId?: string | null;
}

export function useRealtimeMessages(options: UseRealtimeMessagesOptions) {
  const { userId, clientId, projectId } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!userId && !clientId) return;

    async function load() {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (userId) {
        query = query.or(`sender_id.eq.${userId},is_from_studio.eq.true`);
      }
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      if (projectId !== undefined) {
        if (projectId === null) {
          query = query.is("project_id", null);
        } else {
          query = query.eq("project_id", projectId);
        }
      }

      const { data } = await query;
      setMessages((data as Message[]) ?? []);
      setLoading(false);
    }

    load();
  }, [userId, clientId, projectId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId && !clientId) return;

    let channel: RealtimeChannel;

    channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it matches our filter
          const matchesUser =
            !userId ||
            newMessage.sender_id === userId ||
            newMessage.is_from_studio;
          const matchesProject =
            projectId === undefined ||
            (projectId === null
              ? newMessage.project_id === null
              : newMessage.project_id === projectId);

          if (matchesUser && matchesProject) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, clientId, projectId]);

  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", messageIds);
    },
    []
  );

  return { messages, loading, setMessages, markAsRead };
}
