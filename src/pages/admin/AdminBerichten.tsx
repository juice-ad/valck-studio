import { useEffect, useState, type FormEvent } from "react";
import { Send, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { notifyClientMembers } from "@/lib/notifications";
import type { Message } from "@/types/portal";

interface MessageRow extends Message {
  profiles: { full_name: string } | null;
}

interface Conversation {
  clientId: string;
  clientName: string;
  messages: MessageRow[];
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
      .not("client_id", "is", null)
      .order("created_at", { ascending: true });

    const msgs = (data as MessageRow[]) ?? [];

    // Groepeer per klant - elke klant is een aparte chat
    const groups: Record<string, MessageRow[]> = {};
    for (const msg of msgs) {
      const key = msg.client_id as string;
      (groups[key] ??= []).push(msg);
    }

    const convos: Conversation[] = Object.entries(groups).map(([clientId, messages]) => {
      const last = messages[messages.length - 1];
      return { clientId, clientName: "Klant", messages, lastMessage: last.body, lastAt: last.created_at };
    });
    convos.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

    // Bedrijfsnamen ophalen
    const clientIds = convos.map((c) => c.clientId);
    if (clientIds.length > 0) {
      const { data: clients } = await supabase.from("clients").select("id, company_name").in("id", clientIds);
      const nameMap = new Map((clients ?? []).map((c: { id: string; company_name: string }) => [c.id, c.company_name]));
      for (const c of convos) c.clientName = nameMap.get(c.clientId) ?? "Klant";
    }

    setConversations(convos);
    setActiveConvo((prev) => prev ?? convos[0]?.clientId ?? null);
    setLoading(false);
  }

  useEffect(() => { loadMessages(); }, []);

  const active = conversations.find((c) => c.clientId === activeConvo);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !user || !active) return;
    setSending(true);

    await supabase.from("messages").insert({
      client_id: active.clientId,
      sender_id: user.id,
      body: replyBody.trim(),
      is_from_studio: true,
    });

    await notifyClientMembers(active.clientId, {
      type: "message",
      title: "Nieuw bericht van Valck Studio",
      body: replyBody.trim().slice(0, 120),
      link: "/portal/berichten",
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
        {/* Chatlijst per klant */}
        <div className="lg:col-span-1 rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <div className="p-4 border-b border-border-light">
            <h2 className="text-sm font-semibold text-text">Klanten</h2>
          </div>
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">Geen berichten.</p>
          ) : (
            <div className="flex flex-col">
              {conversations.map((convo) => {
                const isActive = convo.clientId === activeConvo;
                return (
                  <button
                    key={convo.clientId}
                    onClick={() => setActiveConvo(convo.clientId)}
                    className={`text-left p-4 border-b border-border-light last:border-b-0 transition-colors flex items-start gap-3 ${
                      isActive ? "bg-accent-soft" : "hover:bg-accent-soft/30"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text truncate">{convo.clientName}</p>
                      <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{convo.lastMessage}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(convo.lastAt).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Gesprek */}
        <div className="lg:col-span-2 rounded-[12px] bg-bg-white border border-border-light flex flex-col" style={{ minHeight: 400 }}>
          {active ? (
            <>
              <div className="p-4 border-b border-border-light">
                <h2 className="text-sm font-semibold text-text">{active.clientName}</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {active.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] p-3 rounded-[8px] ${
                      msg.is_from_studio ? "bg-text text-white self-end" : "bg-accent-soft text-text self-start"
                    }`}
                  >
                    {!msg.is_from_studio && msg.profiles?.full_name && (
                      <p className="text-xs font-medium mb-1 text-text-muted">{msg.profiles.full_name}</p>
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
              <p className="text-sm text-text-muted">Selecteer een klant</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
