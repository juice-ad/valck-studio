import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  userId: string;
  isTyping: boolean;
  online: boolean;
}

interface UsePresenceOptions {
  channelName: string;
  userId: string;
  userName?: string;
}

export function usePresence({ channelName, userId, userName }: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!channelName || !userId) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: string[] = [];
        const typing: string[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          users.push(key);
          const latest = presences[presences.length - 1] as unknown as PresenceState;
          if (latest?.isTyping && key !== userId) {
            typing.push(key);
          }
        });

        setOnlineUsers(users);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            userName: userName ?? "",
            isTyping: false,
            online: true,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, userId, userName]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return;

      channelRef.current.track({
        userId,
        userName: userName ?? "",
        isTyping,
        online: true,
      });

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({
            userId,
            userName: userName ?? "",
            isTyping: false,
            online: true,
          });
        }, 3000);
      }
    },
    [userId, userName]
  );

  return { onlineUsers, typingUsers, setTyping };
}
