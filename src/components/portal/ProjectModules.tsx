import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Route } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MODULE_KIND, MODULE_STATUS, formatEuros, formatMonthly, moduleIcon, normalizeModuleKind } from "@/lib/modules";
import type { Module, ProjectCost } from "@/types/portal";

export function ProjectModules({ projectId, projectCompleted }: { projectId: string; projectCompleted: boolean }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [moduleResult, costResult] = await Promise.all([
        supabase.from("modules").select("*").eq("project_id", projectId).order("sequence_order"),
        supabase.from("project_costs").select("*").eq("project_id", projectId).order("sequence_order"),
      ]);
      if (!active) return;
      if (!moduleResult.error) setModules((moduleResult.data as Module[]) ?? []);
      if (!costResult.error) setCosts((costResult.data as ProjectCost[]) ?? []);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [projectId]);

  const monthlyTotal = useMemo(() => modules.reduce((sum, item) => sum + (normalizeModuleKind(item.kind) === "agent" ? item.monthly_price_cents ?? 0 : 0), 0), [modules]);
  const setupTotal = useMemo(() => costs.reduce((sum, item) => sum + item.amount_cents, 0), [costs]);

  if (loading) return <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6 text-sm text-text-muted">Modules laden…</div>;
  if (!modules.length && !costs.length) return null;

  return (
    <>
      {modules.length > 0 && (
        <section className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text">Jullie systeem & agents</h2>
              <p className="text-xs text-text-muted mt-0.5">Het fundament eerst, daarna agents die erop werken.</p>
            </div>
            <span className="text-xs text-text-muted">{modules.length} onderdelen</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {modules.map((item) => {
              const moduleKind = normalizeModuleKind(item.kind);
              const Icon = moduleIcon(item.icon, moduleKind);
              const status = MODULE_STATUS[item.status];
              const kind = MODULE_KIND[moduleKind];
              return (
                <Link key={item.id} to={`/portal/projecten/${projectId}/modules/${item.id}`}
                  className="group rounded-[10px] border border-border-light p-4 no-underline hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${moduleKind === "agent" ? "bg-[#f3e8ff]" : "bg-accent-soft"}`}>
                      <Icon size={19} className={moduleKind === "agent" ? "text-[#7c3aed]" : "text-text"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <p className="text-sm font-semibold text-text">{item.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kind.badge}`}>{kind.label}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.badge}`}>{status.label}</span>
                      </div>
                      {item.description && <p className="text-xs text-text-muted line-clamp-2">{item.description}</p>}
                      {moduleKind === "agent" && item.monthly_price_cents != null && <p className="text-xs font-medium text-[#7c3aed] mt-2">Vanaf live: {formatMonthly(item.monthly_price_cents)}</p>}
                    </div>
                    <ArrowRight size={15} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
          {projectCompleted && (
            <div className="mt-4 pt-4 border-t border-border-light flex items-center gap-3">
              <Route size={18} className="text-text-muted" />
              <div className="flex-1"><p className="text-sm font-medium text-text">Wat wordt de volgende stap?</p><p className="text-xs text-text-muted">Nu het systeem staat, kunnen we gericht uitbreiden met een volgende module of agent.</p></div>
              <Link to="/portal/build-requests" className="text-sm font-semibold text-text no-underline hover:underline">Bekijk de route</Link>
            </div>
          )}
        </section>
      )}

      {(costs.length > 0 || monthlyTotal > 0) && (
        <section className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-1">Kosten, helder uitgesplitst</h2>
          <p className="text-xs text-text-muted mb-4">Setup betaal je bij oplevering. Agentkosten starten pas zodra de agent live staat.</p>
          {costs.length > 0 && <div className="divide-y divide-border-light">
            {costs.map((cost) => <div key={cost.id} className="flex items-center justify-between gap-4 py-2.5 text-sm"><span className="text-text-secondary">{cost.description}{cost.is_overrun && <span className="ml-2 text-[10px] rounded-full bg-amber-bg text-amber px-2 py-0.5">Uitloop</span>}</span><span className="font-medium tabular-nums">{formatEuros(cost.amount_cents)}</span></div>)}
            <div className="flex items-center justify-between py-3 font-semibold text-sm"><span>Eenmalige setup</span><span>{formatEuros(setupTotal)}</span></div>
          </div>}
          {monthlyTotal > 0 && <div className="mt-3 rounded-[8px] bg-[#f3e8ff] px-4 py-3 flex items-center gap-3"><Bot size={17} className="text-[#7c3aed]" /><span className="flex-1 text-sm font-medium text-text">Vanaf live</span><span className="text-sm font-semibold text-[#7c3aed]">{formatMonthly(monthlyTotal)}</span></div>}
        </section>
      )}
    </>
  );
}
