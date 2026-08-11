import { createElement, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bot, ExternalLink, Loader2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { MODULE_KIND, MODULE_STATUS, formatMonthly, moduleIcon, normalizeModuleKind } from "@/lib/modules";
import type { AgentActivity, Module, PreviewFeedback } from "@/types/portal";

export function ModuleDetail() {
  const { id: projectId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();
  const [module, setModule] = useState<Module | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [feedback, setFeedback] = useState<PreviewFeedback[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleId) return;
    async function load() {
      const [moduleResult, feedbackResult, activityResult] = await Promise.all([
        supabase.from("modules").select("*").eq("id", moduleId).single(),
        supabase.from("preview_feedback").select("*").eq("module_id", moduleId).order("created_at"),
        supabase.from("agent_activities").select("*").eq("module_id", moduleId).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }),
      ]);
      setModule((moduleResult.data as Module) ?? null);
      setFeedback((feedbackResult.data as PreviewFeedback[]) ?? []);
      setActivities((activityResult.data as AgentActivity[]) ?? []);
      setLoading(false);
    }
    void load();
  }, [moduleId]);

  async function submitFeedback(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || !user || !projectId || !moduleId || !activeClientId) return;
    setSending(true);
    const { data, error } = await supabase.from("preview_feedback").insert({
      project_id: projectId,
      client_id: activeClientId,
      module_id: moduleId,
      deployment_url: module?.preview_url ?? "",
      body: body.trim(),
      status: "open",
    }).select().single();
    if (!error && data) { setFeedback((current) => [...current, data as PreviewFeedback]); setBody(""); }
    setSending(false);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  if (!module) return <div className="text-center py-12"><p className="text-sm text-text-muted">Onderdeel niet gevonden.</p><Link to={`/portal/projecten/${projectId}`} className="text-sm text-text no-underline hover:underline">Terug naar project</Link></div>;

  const moduleKind = normalizeModuleKind(module.kind);
  const icon = moduleIcon(module.icon, moduleKind);
  const status = MODULE_STATUS[module.status];
  const kind = MODULE_KIND[moduleKind];

  return (
    <div className="max-w-3xl">
      <Link to={`/portal/projecten/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-text-secondary no-underline hover:text-text mb-6"><ArrowLeft size={16} /> Terug naar project</Link>
      <header className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center ${module.kind === "agent" ? "bg-[#f3e8ff]" : "bg-accent-soft"}`}>{createElement(icon, { size: 22, className: module.kind === "agent" ? "text-[#7c3aed]" : "text-text" })}</div>
        <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-text">{module.name}</h1><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${kind.badge}`}>{kind.label}</span><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.badge}`}>{status.label}</span></div>{module.description && <p className="text-sm text-text-secondary mt-2">{module.description}</p>}{module.kind === "agent" && module.monthly_price_cents != null && <p className="text-sm font-semibold text-[#7c3aed] mt-2">Vanaf live: {formatMonthly(module.monthly_price_cents)}</p>}</div>
      </header>

      {module.status === "live" && module.preview_url && <div className="rounded-[12px] bg-green-bg border border-green-border p-5 mb-6 flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-text">Dit onderdeel staat live</p><p className="text-xs text-text-secondary">Klaar voor dagelijks gebruik.</p></div><a href={module.preview_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline">Openen <ArrowRight size={15} /></a></div>}

      {module.kind === "agent" && <section className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-center gap-2 mb-4"><Bot size={17} className="text-[#7c3aed]" /><h2 className="text-sm font-semibold text-text">Wat deed deze agent?</h2></div>
        {activities.length ? <div className="space-y-4">{activities.map((activity) => <div key={activity.id} className="border-l-2 border-[#8b5cf6] pl-4 py-0.5"><p className="text-sm text-text">{activity.summary}</p><p className="text-xs text-text-muted mt-1">{new Date(`${activity.occurred_on}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}</p></div>)}</div> : <p className="text-sm text-text-muted">Zodra de agent werk uitvoert, verschijnt het weekoverzicht hier.</p>}
      </section>}

      {module.preview_url && module.status !== "live" && <section className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-text">Preview</h2><a href={module.preview_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-text font-medium no-underline hover:underline"><ExternalLink size={14} /> Open preview</a></div></section>}

      <section className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Feedback</h2>
        <form onSubmit={submitFeedback} className="flex gap-2"><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} placeholder="Wat werkt goed of kan beter?" className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none outline-none focus:border-text" /><button disabled={sending || !body.trim()} className="self-end bg-text text-white rounded-[8px] p-2.5 disabled:opacity-50">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button></form>
        {feedback.length > 0 && <div className="space-y-3 mt-5 pt-5 border-t border-border-light">{feedback.map((item) => <div key={item.id} className="border-l-2 border-border-light pl-3"><p className="text-sm text-text">{item.body}</p><p className="text-xs text-text-muted mt-1">{new Date(item.created_at).toLocaleDateString("nl-NL")}</p></div>)}</div>}
      </section>
    </div>
  );
}
