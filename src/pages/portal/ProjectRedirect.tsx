import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";

/**
 * "Project" in de zijbalk: stuurt door naar het (primaire) project van de klant.
 * Zo hoeft de klant geen projectenlijst te doorlopen als er maar één is.
 */
export function ProjectRedirect() {
  const { activeClientId } = useActiveClient();
  const [projectId, setProjectId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!activeClientId) return;
    supabase
      .from("projects")
      .select("id")
      .eq("client_id", activeClientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => setProjectId((data?.[0]?.id as string) ?? null));
  }, [activeClientId]);

  if (projectId === undefined) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  }

  if (projectId) return <Navigate to={`/portal/projecten/${projectId}`} replace />;

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
