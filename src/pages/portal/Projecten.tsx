import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Project, ProjectPhase } from "@/types/portal";

const phaseStyles: Record<ProjectPhase, string> = {
  discovery: "bg-blue-bg text-blue",
  build: "bg-green-bg text-green",
  scale: "bg-accent-soft text-text",
  completed: "bg-green-bg text-green",
};

const phaseLabels: Record<ProjectPhase, string> = {
  discovery: "Discovery",
  build: "Build",
  scale: "Scale",
  completed: "Afgerond",
};

export function Projecten() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("projects")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data as Project[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Projecten</h1>

      {projects.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">
            Er zijn nog geen projecten aan je account gekoppeld.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/portal/projecten/${project.id}`}
              className="rounded-[12px] bg-bg-white border border-border-light p-6 no-underline hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-text">
                  {project.title}
                </h2>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${phaseStyles[project.phase]}`}
                >
                  {phaseLabels[project.phase]}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {project.description}
                </p>
              )}
              {project.start_date && (
                <p className="text-xs text-text-muted">
                  Gestart:{" "}
                  {new Date(project.start_date).toLocaleDateString("nl-NL")}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
