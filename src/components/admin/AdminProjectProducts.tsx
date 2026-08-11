import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Bot, Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  MODULE_ICON_NAMES, MODULE_KIND, MODULE_STATUS, MODULE_STATUS_OPTIONS,
  formatEuros, formatMonthly, moduleIcon, normalizeModuleKind,
} from "@/lib/modules";
import type { AgentActivity, Module, ModuleKind, ModuleStatus, ProjectCost } from "@/types/portal";

type ProductTab = "modules" | "agents" | "kosten";
type ModuleForm = {
  name: string; description: string; status: ModuleStatus; kind: ModuleKind;
  monthlyPrice: string; previewUrl: string; icon: string;
};

const emptyModule = (kind: ModuleKind = "system"): ModuleForm => ({
  name: "", description: "", status: "planned", kind,
  monthlyPrice: "", previewUrl: "", icon: "",
});

function centsFromInput(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Math.max(0, Math.round((Number.parseFloat(normalized) || 0) * 100));
}

export function AdminProjectProducts({ projectId, clientId }: { projectId: string; clientId: string }) {
  const [tab, setTab] = useState<ProductTab>("modules");
  const [modules, setModules] = useState<Module[]>([]);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModule());
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [savingModule, setSavingModule] = useState(false);
  const [activityForm, setActivityForm] = useState({ moduleId: "", date: new Date().toISOString().slice(0, 10), summary: "" });
  const [savingActivity, setSavingActivity] = useState(false);
  const [dropDraft, setDropDraft] = useState({ title: "", body: "" });
  const [postingDrop, setPostingDrop] = useState(false);
  const [costForm, setCostForm] = useState({ description: "", amount: "", isOverrun: false });
  const [savingCost, setSavingCost] = useState(false);

  const agents = useMemo(() => modules.filter((item) => normalizeModuleKind(item.kind) === "agent"), [modules]);

  const load = useCallback(async () => {
    const [moduleResult, costResult] = await Promise.all([
      supabase.from("modules").select("*").eq("project_id", projectId).order("sequence_order"),
      supabase.from("project_costs").select("*").eq("project_id", projectId).order("sequence_order"),
    ]);
    if (moduleResult.error || costResult.error) {
      setError("De productgegevens konden niet worden geladen. Is migratie 010 uitgevoerd?");
      setLoading(false);
      return;
    }
    setError(null);
    const loadedModules = (moduleResult.data as Module[]) ?? [];
    setModules(loadedModules);
    setCosts((costResult.data as ProjectCost[]) ?? []);
    const agentIds = loadedModules.filter((item) => item.kind === "agent").map((item) => item.id);
    if (agentIds.length) {
      const activityResult = await supabase.from("agent_activities").select("*")
        .in("module_id", agentIds).order("occurred_on", { ascending: false }).order("created_at", { ascending: false });
      setActivities((activityResult.data as AgentActivity[]) ?? []);
    } else {
      setActivities([]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  function startNewModule(kind: ModuleKind) {
    setEditingModuleId(null);
    setModuleForm(emptyModule(kind));
  }

  function startEditModule(module: Module) {
    setEditingModuleId(module.id);
    setModuleForm({
      name: module.name,
      description: module.description ?? "",
      status: module.status,
      kind: normalizeModuleKind(module.kind),
      monthlyPrice: module.monthly_price_cents == null ? "" : String(module.monthly_price_cents / 100).replace(".", ","),
      previewUrl: module.preview_url ?? "",
      icon: module.icon ?? "",
    });
  }

  async function saveModule(event: FormEvent) {
    event.preventDefault();
    if (!moduleForm.name.trim()) return;
    setSavingModule(true);
    setError(null);
    const payload = {
      project_id: projectId,
      client_id: clientId,
      name: moduleForm.name.trim(),
      description: moduleForm.description.trim() || null,
      status: moduleForm.status,
      kind: moduleForm.kind,
      monthly_price_cents: moduleForm.kind === "agent" && moduleForm.monthlyPrice.trim()
        ? centsFromInput(moduleForm.monthlyPrice) : null,
      preview_url: moduleForm.previewUrl.trim() || null,
      icon: moduleForm.icon || null,
      sequence_order: editingModuleId ? undefined : modules.length,
    };
    const result = editingModuleId
      ? await supabase.from("modules").update(payload).eq("id", editingModuleId)
      : await supabase.from("modules").insert(payload);
    setSavingModule(false);
    if (result.error) { setError(result.error.message); return; }
    setEditingModuleId(null);
    setModuleForm(emptyModule(moduleForm.kind));
    await load();
  }

  async function removeModule(module: Module) {
    if (!window.confirm(`‘${module.name}’ inclusief gekoppelde activiteit verwijderen?`)) return;
    const { error: removeError } = await supabase.from("modules").delete().eq("id", module.id);
    if (removeError) setError(removeError.message); else await load();
  }

  async function addActivity(event: FormEvent) {
    event.preventDefault();
    if (!activityForm.moduleId || !activityForm.summary.trim()) return;
    setSavingActivity(true);
    const { error: insertError } = await supabase.from("agent_activities").insert({
      module_id: activityForm.moduleId,
      client_id: clientId,
      occurred_on: activityForm.date,
      summary: activityForm.summary.trim(),
    });
    setSavingActivity(false);
    if (insertError) { setError(insertError.message); return; }
    setActivityForm((current) => ({ ...current, summary: "" }));
    await load();
  }

  function generateDrop() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recent = activities.filter((activity) => new Date(`${activity.occurred_on}T12:00:00`) >= cutoff);
    const lines = recent.map((activity) => {
      const agent = agents.find((item) => item.id === activity.module_id);
      return `• ${agent?.name ?? "Agent"}: ${activity.summary}`;
    });
    setDropDraft({
      title: "Wat jullie agents deze week deden",
      body: lines.length ? lines.join("\n") : "Deze week is er nog geen agentactiviteit vastgelegd.",
    });
  }

  async function publishDrop(event: FormEvent) {
    event.preventDefault();
    if (!dropDraft.title.trim()) return;
    setPostingDrop(true);
    const { error: insertError } = await supabase.from("project_updates").insert({
      project_id: projectId,
      title: dropDraft.title.trim(),
      body: dropDraft.body.trim() || null,
      kind: "drop",
    });
    setPostingDrop(false);
    if (insertError) { setError(insertError.message); return; }
    setDropDraft({ title: "", body: "" });
  }

  async function addCost(event: FormEvent) {
    event.preventDefault();
    if (!costForm.description.trim()) return;
    setSavingCost(true);
    const { error: insertError } = await supabase.from("project_costs").insert({
      project_id: projectId,
      client_id: clientId,
      description: costForm.description.trim(),
      amount_cents: centsFromInput(costForm.amount),
      is_overrun: costForm.isOverrun,
      sequence_order: costs.length,
    });
    setSavingCost(false);
    if (insertError) { setError(insertError.message); return; }
    setCostForm({ description: "", amount: "", isOverrun: false });
    await load();
  }

  async function removeCost(cost: ProjectCost) {
    const { error: removeError } = await supabase.from("project_costs").delete().eq("id", cost.id);
    if (removeError) setError(removeError.message); else await load();
  }

  if (loading) return <div className="rounded-[12px] border border-border-light bg-bg-white p-6 mb-6 text-sm text-text-muted">Productlijnen laden…</div>;

  const displayedModules = tab === "agents" ? agents : modules.filter((item) => item.kind === "system");
  const setupTotal = costs.reduce((total, item) => total + item.amount_cents, 0);
  const monthlyTotal = agents.reduce((total, item) => total + (item.monthly_price_cents ?? 0), 0);

  return (
    <section className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-text">Modules, agents & kosten</h2>
          <p className="text-xs text-text-muted mt-0.5">Beheer de productladder en wekelijkse agentactiviteit.</p>
        </div>
        <div className="flex rounded-[8px] bg-bg p-1">
          {(["modules", "agents", "kosten"] as ProductTab[]).map((item) => (
            <button key={item} type="button" onClick={() => { setTab(item); if (item !== "kosten") startNewModule(item === "agents" ? "agent" : "system"); }}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium capitalize ${tab === item ? "bg-bg-white text-text shadow-sm" : "text-text-muted"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="rounded-[8px] bg-[#fef2f2] px-3 py-2 text-xs text-[#dc2626] mb-4">{error}</p>}

      {tab !== "kosten" && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-2">
            {displayedModules.length === 0 && <p className="text-sm text-text-muted py-4">Nog geen {tab === "agents" ? "agents" : "modules"}.</p>}
            {displayedModules.map((item) => {
              const Icon = moduleIcon(item.icon, item.kind);
              return <div key={item.id} className="flex items-center gap-3 rounded-[8px] border border-border-light p-3">
                <div className="w-9 h-9 rounded-[8px] bg-accent-soft flex items-center justify-center"><Icon size={17} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text">{item.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${MODULE_KIND[item.kind].badge}`}>{MODULE_KIND[item.kind].label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${MODULE_STATUS[item.status].badge}`}>{MODULE_STATUS[item.status].label}</span>
                  </div>
                  {item.kind === "agent" && item.monthly_price_cents != null && <p className="text-xs text-text-muted mt-0.5">Vanaf live: {formatMonthly(item.monthly_price_cents)}</p>}
                </div>
                <button type="button" onClick={() => startEditModule(item)} aria-label="Bewerken" className="p-1.5 text-text-muted hover:text-text"><Pencil size={14} /></button>
                <button type="button" onClick={() => void removeModule(item)} aria-label="Verwijderen" className="p-1.5 text-text-muted hover:text-[#dc2626]"><Trash2 size={14} /></button>
              </div>;
            })}
          </div>
          <form onSubmit={saveModule} className="rounded-[8px] bg-bg border border-border-light p-4 space-y-3">
            <p className="text-xs font-semibold text-text">{editingModuleId ? "Bewerken" : `${moduleForm.kind === "agent" ? "Agent" : "Module"} toevoegen`}</p>
            <input required value={moduleForm.name} onChange={(event) => setModuleForm({ ...moduleForm, name: event.target.value })} placeholder="Naam" className={inputClass} />
            <textarea value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} placeholder="Korte omschrijving" rows={2} className={`${inputClass} resize-none`} />
            <div className="grid grid-cols-2 gap-2">
              <select value={moduleForm.status} onChange={(event) => setModuleForm({ ...moduleForm, status: event.target.value as ModuleStatus })} className={inputClass}>
                {MODULE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={moduleForm.icon} onChange={(event) => setModuleForm({ ...moduleForm, icon: event.target.value })} className={inputClass}>
                <option value="">Standaardicoon</option>{MODULE_ICON_NAMES.map((icon) => <option key={icon}>{icon}</option>)}
              </select>
            </div>
            {moduleForm.kind === "agent" && <input value={moduleForm.monthlyPrice} onChange={(event) => setModuleForm({ ...moduleForm, monthlyPrice: event.target.value })} placeholder="Maandprijs in €" inputMode="decimal" className={inputClass} />}
            <input value={moduleForm.previewUrl} onChange={(event) => setModuleForm({ ...moduleForm, previewUrl: event.target.value })} placeholder="Preview- of live-link" type="url" className={inputClass} />
            <button disabled={savingModule} className="w-full bg-text text-white rounded-[8px] py-2 text-sm font-semibold disabled:opacity-50">{savingModule ? "Opslaan…" : editingModuleId ? "Wijzigingen opslaan" : "Toevoegen"}</button>
          </form>
        </div>
      )}

      {tab === "agents" && agents.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-5 mt-6 pt-6 border-t border-border-light">
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">Activiteit vastleggen</h3>
            <form onSubmit={addActivity} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select value={activityForm.moduleId} onChange={(event) => setActivityForm({ ...activityForm, moduleId: event.target.value })} required className={inputClass}>
                  <option value="">Kies agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
                <input type="date" value={activityForm.date} onChange={(event) => setActivityForm({ ...activityForm, date: event.target.value })} className={inputClass} />
              </div>
              <textarea value={activityForm.summary} onChange={(event) => setActivityForm({ ...activityForm, summary: event.target.value })} required rows={2} placeholder="Wat deed de agent?" className={`${inputClass} resize-none`} />
              <button disabled={savingActivity} className="inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-3 py-2 text-sm font-semibold disabled:opacity-50">{savingActivity ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Opslaan</button>
            </form>
            <div className="mt-4 space-y-2 max-h-56 overflow-auto">
              {activities.map((activity) => <div key={activity.id} className="border-l-2 border-[#8b5cf6] pl-3 py-1"><p className="text-sm text-text">{activity.summary}</p><p className="text-xs text-text-muted">{agents.find((agent) => agent.id === activity.module_id)?.name} · {new Date(`${activity.occurred_on}T12:00:00`).toLocaleDateString("nl-NL")}</p></div>)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-text">Wekelijkse drop</h3><button type="button" onClick={generateDrop} className="text-xs font-medium text-[#7c3aed]">Vul met deze week</button></div>
            <form onSubmit={publishDrop} className="space-y-2">
              <input value={dropDraft.title} onChange={(event) => setDropDraft({ ...dropDraft, title: event.target.value })} placeholder="Titel" className={inputClass} />
              <textarea value={dropDraft.body} onChange={(event) => setDropDraft({ ...dropDraft, body: event.target.value })} placeholder="Samenvatting voor de klant" rows={5} className={`${inputClass} resize-none`} />
              <button disabled={postingDrop || !dropDraft.title.trim()} className="inline-flex items-center gap-1.5 bg-[#7c3aed] text-white rounded-[8px] px-3 py-2 text-sm font-semibold disabled:opacity-50">{postingDrop ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publiceer drop</button>
            </form>
          </div>
        </div>
      )}

      {tab === "kosten" && (
        <div>
          <form onSubmit={addCost} className="grid sm:grid-cols-[1fr_150px_auto_auto] gap-2 rounded-[8px] bg-bg border border-border-light p-3 mb-4">
            <input value={costForm.description} onChange={(event) => setCostForm({ ...costForm, description: event.target.value })} placeholder="Setup-omschrijving" required className={inputClass} />
            <input value={costForm.amount} onChange={(event) => setCostForm({ ...costForm, amount: event.target.value })} placeholder="Bedrag €" inputMode="decimal" className={inputClass} />
            <label className="flex items-center gap-2 px-2 text-xs text-text-secondary"><input type="checkbox" checked={costForm.isOverrun} onChange={(event) => setCostForm({ ...costForm, isOverrun: event.target.checked })} /> Uitloop</label>
            <button disabled={savingCost} className="bg-text text-white rounded-[8px] px-3 py-2 text-sm font-semibold"><Plus size={14} className="inline mr-1" />Regel</button>
          </form>
          <div className="divide-y divide-border-light border border-border-light rounded-[8px] overflow-hidden">
            {costs.map((cost) => <div key={cost.id} className="flex items-center gap-3 px-4 py-3"><span className="flex-1 text-sm text-text">{cost.description}{cost.is_overrun && <span className="ml-2 text-[10px] rounded-full bg-amber-bg text-amber px-2 py-0.5">Uitloop</span>}</span><span className="text-sm font-medium tabular-nums">{formatEuros(cost.amount_cents)}</span><button type="button" onClick={() => void removeCost(cost)} className="text-text-muted hover:text-[#dc2626]"><Trash2 size={14} /></button></div>)}
            {!costs.length && <p className="px-4 py-5 text-sm text-text-muted">Nog geen setup-kosten.</p>}
            <div className="flex items-center justify-between px-4 py-3 bg-bg font-semibold text-sm"><span>Setup totaal</span><span>{formatEuros(setupTotal)}</span></div>
          </div>
          {monthlyTotal > 0 && <div className="mt-3 rounded-[8px] bg-[#f3e8ff] px-4 py-3 flex items-center gap-3"><Bot size={17} className="text-[#7c3aed]" /><span className="flex-1 text-sm font-medium text-text">Vanaf live</span><span className="text-sm font-semibold text-[#7c3aed]">{formatMonthly(monthlyTotal)}</span></div>}
        </div>
      )}
    </section>
  );
}

const inputClass = "w-full rounded-[8px] border border-border-light bg-bg-white px-3 py-2 text-sm text-text outline-none focus:border-text";
