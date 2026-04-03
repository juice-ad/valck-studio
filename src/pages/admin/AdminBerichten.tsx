import { useEffect, useState, type FormEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/types/portal";

interface MessageWithProfile extends Message {
  profiles: { full_name: string } | null;
}

interface Conversation {
  projectId: string | null;
  projectTitle: string;
  messages: MessageWithProfile[];
  lastMessage: string;
  lastAt: string;
}

export function AdminBerichten() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles:sender_id(full_name)")
      .order("created_at", { ascending: true });

    const msgs = (data as MessageWithProfile[]) ?? [];

    // Group by project_id
    const groups: Record<string, MessageWithProfile[]> = {};
    for (const msg of msgs) {
      const key = msg.project_id ?? "general";
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    }

    // Build conversations
    const convos: Conversation[] = Object.entries(groups).map(([key, messages]) => {
      const last = messages[messages.length - 1];
      return {
        projectId: key === "general" ? null : key,
        projectTitle: key === "general" ? "Algemeen" : `Project`,
        messages,
        lastMessage: last.body,
        lastAt: last.created_at,
      };
    });

    // Sort by most recent message
    convos.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

    // Load project titles
    const projectIds = convos.filter((c) => c.projectId).map((c) => c.projectId!);
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds);
      const titleMap = new Map((projects ?? []).map((p: { id: string; title: string }) => [p.id, p.title]));
      for (const c of convos) {
        if (c.projectId) c.projectTitle = titleMap.get(c.projectId) ?? "Project";
      }
    }

    setConversations(convos);
    if (!activeConvo && convos.length > 0) setActiveConvo(convos[0].projectId ?? "general");
    setLoading(false);
  }

  useEffect(() => { loadMessages(); }, []);

  const active = conversations.find((c) => (c.projectId ?? "general") === activeConvo);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !user || !active) return;
    setSending(true);

    await supabase.from("messages").insert({
      project_id: active.projectId,
      sender_id: user.id,
      body: replyBody.trim(),
      is_from_studio: true,
    });

    setReplyBody("");
    setSending(false);
    loadMessages();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Berichten</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation list */}
        <div className="lg:col-span-1 rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <div className="p-4 border-b border-border-light">
            <h2 className="text-sm font-semibold text-text">Gesprekken</h2>
          </div>
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">Geen berichten.</p>
          ) : (
            <div className="flex flex-col">
              {conversations.map((convo) => {
                const key = convo.projectId ?? "general";
                const isActive = key === activeConvo;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveConvo(key)}
                    className={`text-left p-4 border-b border-border-light last:border-b-0 transition-colors ${
                      isActive ? "bg-accent-soft" : "hover:bg-accent-soft/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-text">{convo.projectTitle}</p>
                    <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{convo.lastMessage}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(convo.lastAt).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message thread */}
        <div className="lg:col-span-2 rounded-[12px] bg-bg-white border border-border-light flex flex-col" style={{ minHeight: 400 }}>
          {active ? (
            <>
              <div className="p-4 border-b border-border-light">
                <h2 className="text-sm font-semibold text-text">{active.projectTitle}</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {active.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] p-3 rounded-[8px] ${
                      msg.is_from_studio
                        ? "bg-text text-white self-end"
                        : "bg-accent-soft text-text self-start"
                    }`}
                  >
                    {!msg.is_from_studio && msg.profiles?.full_name && (
                      <p className={`text-xs font-medium mb-1 ${msg.is_from_studio ? "text-white/70" : "text-text-muted"}`}>
                        {msg.profiles.full_name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.is_from_studio ? "text-white/50" : "text-text-muted"}`}>
                      {new Date(msg.created_at).toLocaleString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="p-4 border-t border-border-light flex gap-2">
                <input
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Antwoord als Valck Studio..."
                  className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending || !replyBody.trim()}
                  className="bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-text-muted">Selecteer een gesprek</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
