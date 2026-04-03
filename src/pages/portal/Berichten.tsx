import { useEffect, useState, useRef, type FormEvent } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/types/portal";

export function Berichten() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},is_from_studio.eq.true`)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user) return;

    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        body: body.trim(),
        is_from_studio: false,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
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
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 rounded-[12px] bg-bg-white border border-border-light p-3"
      >
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
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
