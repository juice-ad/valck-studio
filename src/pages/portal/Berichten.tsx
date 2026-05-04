import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { usePresence } from "@/hooks/usePresence";
import type { Message } from "@/types/portal";

export function Berichten() {
  const { user, profile } = useAuth();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, loading, setMessages, markAsRead } = useRealtimeMessages({
    userId: user?.id,
    projectId: null, // General channel
  });

  const { typingUsers, setTyping } = usePresence({
    channelName: user ? `chat:${user.id}` : "",
    userId: user?.id ?? "",
    userName: profile?.full_name ?? "",
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unread = messages
      .filter((m) => m.is_from_studio && !(m as Message & { is_read?: boolean }).is_read)
      .map((m) => m.id);
    if (unread.length > 0) markAsRead(unread);
  }, [messages, user, markAsRead]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBody(e.target.value);
    setTyping(true);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;

    setSending(true);
    setTyping(false);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        body: body.trim(),
        is_from_studio: false,
        project_id: null,
      })
      .select()
      .single();

    if (!error && data) {
      // Message will arrive via realtime, but add optimistically
      setMessages((prev) => {
        if (prev.find((m) => m.id === (data as Message).id)) return prev;
        return [...prev, data as Message];
      });
      setBody("");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  const isOtherTyping = typingUsers.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <h1 className="text-2xl font-bold text-text mb-4">Berichten</h1>

      {/* Messages */}
      <div className="flex-1 overflow-auto rounded-[12px] bg-bg-white border border-border-light p-4 mb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            Nog geen berichten. Stuur je eerste bericht!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] ${
                  msg.is_from_studio ? "self-start" : "self-end"
                }`}
              >
                <div
                  className={`rounded-[12px] px-4 py-2.5 text-sm ${
                    msg.is_from_studio
                      ? "bg-accent-soft text-text"
                      : "bg-text text-white"
                  }`}
                >
                  {msg.body}
                </div>
                <p
                  className={`text-xs text-text-muted mt-1 ${
                    msg.is_from_studio ? "" : "text-right"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 mt-2 ml-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-text-muted">
              Valck Studio is aan het typen...
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 rounded-[12px] bg-bg-white border border-border-light p-3"
      >
        <input
          type="text"
          value={body}
          onChange={handleInputChange}
          placeholder="Typ een bericht..."
          className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
