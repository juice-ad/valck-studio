import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowRight, Sparkles, ChevronRight, FolderKanban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import type { Project, ProjectPhase } from "@/types/portal";

const phaseLabels: Record<ProjectPhase, { label: string; className: string }> = {
  discovery: { label: "Ontdekken", className: "bg-accent-soft text-text-muted" },
  build: { label: "Bouwen", className: "bg-blue-bg text-blue" },
  scale: { label: "Uitbouwen", className: "bg-amber-bg text-amber" },
  completed: { label: "Afgerond", className: "bg-green-bg text-green" },
};

/**
 * "Project" in de zijbalk. Eén project → direct erheen. Meerdere → een
 * overzichtstabel waar de klant het juiste project kiest.
 */
export function ProjectRedirect() {
  const { activeClientId } = useActiveClient();
  const [projects, setProjects] = useState<Project[] | undefined>(undefined);
  const [stepCounts, setStepCounts] = useState<Record<string, { done: number; total: number }>>({});

  useEffect(() => {
    if (!activeClientId) return;
    async function load() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", activeClientId!)
        .order("created_at", { ascending: false });
      const rows = (data as Project[]) ?? [];
      setProjects(rows);

      if (rows.length > 1) {
        const { data: steps } = await supabase
          .from("workflow_steps")
          .select("project_id, status")
          .eq("client_id", activeClientId!);
        const counts: Record<string, { done: number; total: number }> = {};
        (steps ?? []).forEach((s: { project_id: string; status: string }) => {
          const c = counts[s.project_id] ?? { done: 0, total: 0 };
          c.total += 1;
          if (s.status === "completed") c.done += 1;
          counts[s.project_id] = c;
        });
        setStepCounts(counts);
      }
    }
    load();
  }, [activeClientId]);

  if (projects === undefined) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  }

  // Eén project → direct doorsturen
  if (projects.length === 1) return <Navigate to={`/portal/projecten/${projects[0].id}`} replace />;

  // Geen project → intake-uitnodiging
  if (projects.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-text mb-2">Project</h1>
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center mt-6">
          <Sparkles className="mx-auto mb-3 text-text-muted" size={28} />
          <p className="text-text font-medium mb-1">Er is nog geen project</p>
          <p className="text-sm text-text-muted mb-5">Zodra we jullie intake hebben doorgenomen, starten we het project.</p>
          <Link to="/portal/discovery" className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline">
            Naar de intake <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Meerdere projecten → datatabel
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-text mb-1">Jullie projecten</h1>
      <p className="text-text-secondary mb-6">Kies een project om verder te gaan.</p>

      <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
        {projects.map((p, i) => {
          const phase = phaseLabels[p.phase];
          const count = stepCounts[p.id];
          return (
            <Link
              key={p.id}
              to={`/portal/projecten/${p.id}`}
              className={`flex items-center gap-4 px-5 py-4 no-underline hover:bg-bg transition-colors ${i > 0 ? "border-t border-border-light" : ""}`}
            >
              <div className="w-10 h-10 rounded-[8px] bg-accent-soft flex items-center justify-center shrink-0">
                <FolderKanban size={18} className="text-text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text truncate">{p.title}</p>
                {p.description && <p className="text-xs text-text-muted truncate mt-0.5">{p.description}</p>}
              </div>
              {count && count.total > 0 && (
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs text-text-muted">{count.done}/{count.total} stappen</p>
                  <div className="w-24 h-1.5 rounded-full bg-accent-soft overflow-hidden mt-1">
                    <div className="h-full bg-text rounded-full" style={{ width: `${Math.round((count.done / count.total) * 100)}%` }} />
                  </div>
                </div>
              )}
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${phase.className}`}>{phase.label}</span>
              <ChevronRight size={16} className="text-text-muted shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
