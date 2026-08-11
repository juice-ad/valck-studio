import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Send, Loader2, MessageSquare, PartyPopper } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { MODULE_STATUS, MODULE_KIND, moduleIcon, formatMonthly, normalizeModuleKind } from "@/lib/modules";
import type { AgentActivity, Module, PreviewFeedback } from "@/types/portal";

export function ModuleDetail() {
  const { id: projectId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();

  const [module, setModule] = useState<Module | null>(null);
  const [feedback, setFeedback] = useState<PreviewFeedback[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!moduleId) return;
    async function load() {
      const [mRes, fbRes] = await Promise.all([
        supabase.from("modules").select("*").eq("id", moduleId).single(),
        supabase.from("preview_feedback").select("*").eq("module_id", moduleId).order("created_at", { ascending: true }),
      ]);
      const m = (mRes.data as Module) ?? null;
      setModule(m);
      setFeedback((fbRes.data as PreviewFeedback[]) ?? []);
      if (m && normalizeModuleKind(m.kind) === "agent") {
        const { data: actData } = await supabase.from("agent_activities").select("*")
          .eq("module_id", moduleId).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(30);
        setActivities((actData as AgentActivity[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, [moduleId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user || !projectId || !moduleId) return;
    setSending(true);
    const { data, error } = await supabase.from("preview_feedback").insert({
      project_id: projectId,
      client_id: activeClientId,
      module_id: moduleId,
      deployment_url: module?.preview_url ?? "",
      body: body.trim(),
      status: "open",
    }).select().single();
    if (!error && data) {
      setFeedback((prev) => [...prev, data as PreviewFeedback]);
      setBody("");
    }
    setSending(false);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  }
  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Module niet gevonden.</p>
        <Link to={`/portal/projecten/${projectId}`} className="text-sm text-text mt-2 inline-block no-underline hover:underline">Terug naar project</Link>
      </div>
    );
  }

  const st = MODULE_STATUS[module.status];
  const kind = normalizeModuleKind(module.kind);
  const isAgent = kind === "agent";
  const Icon = moduleIcon(module.icon, kind);

  return (
    <div className="max-w-2xl">
      <Link to={`/portal/projecten/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors">
        <ArrowLeft size={16} /> Terug naar project
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${isAgent ? "bg-[#f3e8ff]" : "bg-accent-soft"}`}>
            <Icon size={21} className={isAgent ? "text-[#7c3aed]" : "text-text"} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text leading-tight">{module.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}>{st.label}</span>
              {isAgent && <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${MODULE_KIND.agent.badge}`}>Agent</span>}
              {isAgent && module.monthly_price_cents != null && (
                <span className="text-xs font-medium text-[#7c3aed]">{formatMonthly(module.monthly_price_cents)} vanaf live</span>
              )}
            </div>
          </div>
        </div>
        {module.description && <p className="text-sm text-text-secondary mt-2">{module.description}</p>}
      </motion.div>

      {/* Live-vier-moment */}
      {module.status === "live" && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
          className="rounded-[12px] bg-green-bg border border-green-border p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PartyPopper size={22} className="text-green shrink-0" />
            <div>
              <p className="text-sm font-bold text-text">{isAgent ? "Deze agent draait nu in jullie bedrijf 🎉" : "Deze module staat live in jullie bedrijf 🎉"}</p>
              <p className="text-xs text-text-secondary mt-0.5">{isAgent ? "Hij doet vanaf nu het werk — hieronder zie je wat hij deed." : "Klaar om te gebruiken."}</p>
            </div>
          </div>
          {module.preview_url && (
            <a href={module.preview_url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline">
              Gebruik het nu <ArrowRight size={15} />
            </a>
          )}
        </motion.div>
      )}

      {/* Wat deed deze agent - de reden om terug te komen */}
      {isAgent && activities.length > 0 && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-4">Wat deed deze agent</h2>
          <div className="flex flex-col divide-y divide-border-light">
            {activities.map((a) => (
              <div key={a.id} className="flex items-baseline gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-xs text-text-muted whitespace-nowrap w-14 shrink-0">
                  {new Date(a.occurred_on).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                </span>
                <p className="text-sm text-text">{a.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {module.preview_url ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text">Preview</h2>
            <a href={module.preview_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-text font-medium no-underline hover:underline">
              <ExternalLink size={14} /> Open in nieuw tabblad
            </a>
          </div>
          <div className="rounded-[8px] border border-border-light overflow-hidden">
            <iframe src={module.preview_url} title={module.name} sandbox="allow-scripts allow-same-origin allow-forms" className="w-full h-[480px] border-0" />
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <p className="text-sm text-text-muted">Er staat nog geen preview klaar voor deze module. Zodra we iets kunnen laten zien, verschijnt het hier.</p>
        </div>
      )}

      {/* Feedback geven */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Wat vind je ervan?</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Deel je reactie, wat je anders wilt, of wat goed werkt…"
            rows={3}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
          <button type="submit" disabled={sending || !body.trim()} className="self-start bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Versturen
          </button>
        </form>
      </div>

      {/* Eerdere feedback + studio-antwoord */}
      {feedback.length > 0 && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-sm font-semibold text-text mb-4">Jullie feedback ({feedback.length})</h2>
          <div className="flex flex-col gap-4">
            {feedback.map((fb) => (
              <div key={fb.id} className="border-l-2 border-border-light pl-4 py-1">
                <p className="text-sm text-text">{fb.body}</p>
                <p className="text-xs text-text-muted mt-1">
                  {new Date(fb.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                {fb.admin_response && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-[8px] bg-blue-bg">
                    <MessageSquare size={14} className="text-blue mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue mb-0.5">Studio</p>
                      <p className="text-sm text-text">{fb.admin_response}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
