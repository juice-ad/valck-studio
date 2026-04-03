import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Project,
  ProjectUpdate,
  ProjectPhase,
  VercelDeployment,
  PreviewFeedback,
} from "@/types/portal";

const phases: { key: ProjectPhase; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "build", label: "Build" },
  { key: "scale", label: "Scale" },
];

function phaseIndex(phase: ProjectPhase) {
  if (phase === "completed") return 3;
  return phases.findIndex((p) => p.key === phase);
}

const stateLabels: Record<string, { label: string; className: string }> = {
  READY: {
    label: "Live",
    className: "bg-green-bg text-green",
  },
  BUILDING: {
    label: "Bezig...",
    className: "bg-blue-bg text-blue",
  },
  ERROR: {
    label: "Fout",
    className: "bg-[#fef2f2] text-[#ef4444]",
  },
  QUEUED: {
    label: "Wachtrij",
    className: "bg-accent-soft text-text-muted",
  },
  CANCELED: {
    label: "Geannuleerd",
    className: "bg-accent-soft text-text-muted",
  },
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Vercel preview state
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);

  // Feedback state
  const [feedback, setFeedback] = useState<PreviewFeedback[]>([]);
  const [feedbackBody, setFeedbackBody] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Load project + updates
  useEffect(() => {
    if (!id) return;

    async function load() {
      const [projRes, updRes, fbRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase
          .from("project_updates")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("preview_feedback")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true }),
      ]);

      setProject(projRes.data as Project | null);
      setUpdates((updRes.data as ProjectUpdate[]) ?? []);
      setFeedback((fbRes.data as PreviewFeedback[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id]);

  // Fetch Vercel deployments
  const fetchDeployments = useCallback(async () => {
    if (!project?.vercel_project_id || !id) return;

    setDeploymentsLoading(true);
    setDeploymentsError(null);

    const { data, error } = await supabase.functions.invoke(
      "vercel-deployments",
      { body: { project_id: id } }
    );

    if (error) {
      setDeploymentsError("Kon preview niet laden");
    } else {
      setDeployments(data?.deployments ?? []);
    }
    setDeploymentsLoading(false);
  }, [project?.vercel_project_id, id]);

  // Fetch deployments when project loads + auto-refresh every 60s
  useEffect(() => {
    if (!project?.vercel_project_id) return;

    fetchDeployments();
    const interval = setInterval(fetchDeployments, 60_000);
    return () => clearInterval(interval);
  }, [fetchDeployments, project?.vercel_project_id]);

  // Submit feedback
  async function handleFeedbackSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feedbackBody.trim() || !user || !id) return;

    const latestUrl = deployments[0]?.url ?? project?.live_url ?? "";

    setSendingFeedback(true);
    const { data, error } = await supabase
      .from("preview_feedback")
      .insert({
        project_id: id,
        client_id: user.id,
        deployment_url: latestUrl,
        body: feedbackBody.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setFeedback((prev) => [...prev, data as PreviewFeedback]);
      setFeedbackBody("");
    }
    setSendingFeedback(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Project niet gevonden.</p>
        <Link
          to="/portal/projecten"
          className="text-sm text-text mt-2 inline-block no-underline hover:underline"
        >
          ← Terug naar projecten
        </Link>
      </div>
    );
  }

  const currentPhase = phaseIndex(project.phase);
  const latestDeployment = deployments[0] ?? null;

  return (
    <div>
      <Link
        to="/portal/projecten"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Terug
      </Link>

      <h1 className="text-2xl font-bold text-text mb-6">{project.title}</h1>

      {/* Phase stepper */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-4">Voortgang</h2>
        <div className="flex items-center gap-2">
          {phases.map((phase, i) => (
            <div key={phase.key} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  i <= currentPhase
                    ? "bg-text text-white"
                    : "bg-accent-soft text-text-muted"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm ${
                  i <= currentPhase
                    ? "text-text font-medium"
                    : "text-text-muted"
                }`}
              >
                {phase.label}
              </span>
              {i < phases.length - 1 && (
                <div
                  className={`flex-1 h-px ${
                    i < currentPhase ? "bg-text" : "bg-border-light"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        {project.phase === "completed" && (
          <p className="text-sm text-green font-medium mt-3">
            Project afgerond
          </p>
        )}
      </div>

      {/* Project info */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Projectinfo</h2>
        {project.description && (
          <p className="text-sm text-text-secondary mb-3">
            {project.description}
          </p>
        )}
        {project.start_date && (
          <p className="text-xs text-text-muted">
            Startdatum:{" "}
            {new Date(project.start_date).toLocaleDateString("nl-NL")}
          </p>
        )}
        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-text font-medium mt-2 no-underline hover:underline"
          >
            <ExternalLink size={14} />
            Live website bekijken
          </a>
        )}
      </div>

      {/* Vercel Preview */}
      {project.vercel_project_id && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text">Preview</h2>
            <button
              type="button"
              onClick={fetchDeployments}
              disabled={deploymentsLoading}
              className="text-xs text-text-secondary hover:text-text flex items-center gap-1 transition-colors"
            >
              <RefreshCw
                size={12}
                className={deploymentsLoading ? "animate-spin" : ""}
              />
              Vernieuwen
            </button>
          </div>

          {deploymentsError && (
            <p className="text-sm text-[#ef4444] mb-3">{deploymentsError}</p>
          )}

          {deploymentsLoading && deployments.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
            </div>
          ) : latestDeployment ? (
            <>
              {/* Deployment info */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    stateLabels[latestDeployment.state]?.className ??
                    "bg-accent-soft text-text-muted"
                  }`}
                >
                  {stateLabels[latestDeployment.state]?.label ??
                    latestDeployment.state}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(latestDeployment.created).toLocaleString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {latestDeployment.meta?.githubCommitMessage && (
                  <span className="text-xs text-text-secondary truncate">
                    {latestDeployment.meta.githubCommitMessage}
                  </span>
                )}
              </div>

              {/* Preview iframe */}
              {latestDeployment.state === "READY" && (
                <>
                  <div className="rounded-[8px] border border-border-light overflow-hidden mb-3">
                    <iframe
                      src={latestDeployment.url}
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full h-[500px] border-0"
                    />
                  </div>
                  <a
                    href={latestDeployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-text font-medium no-underline hover:underline"
                  >
                    <ExternalLink size={14} />
                    Open in nieuw tabblad
                  </a>
                </>
              )}

              {/* Other deployments */}
              {deployments.length > 1 && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-xs text-text-muted mb-2">
                    Eerdere deployments
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {deployments.slice(1).map((d) => (
                      <div
                        key={d.uid}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={`font-medium px-2 py-0.5 rounded-full ${
                            stateLabels[d.state]?.className ??
                            "bg-accent-soft text-text-muted"
                          }`}
                        >
                          {stateLabels[d.state]?.label ?? d.state}
                        </span>
                        <span className="text-text-muted">
                          {new Date(d.created).toLocaleString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {d.state === "READY" && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text hover:underline no-underline"
                          >
                            Bekijken
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-text-muted">
              Nog geen preview deployments.
            </p>
          )}
        </div>
      )}

      {/* Feedback */}
      {project.vercel_project_id && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-4">Feedback</h2>

          {feedback.length === 0 ? (
            <p className="text-sm text-text-muted mb-4">
              Nog geen feedback. Deel je eerste reactie!
            </p>
          ) : (
            <div className="flex flex-col gap-3 mb-4">
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="border-l-2 border-border-light pl-4 py-1"
                >
                  <p className="text-sm text-text">{fb.body}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(fb.created_at).toLocaleString("nl-NL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {fb.deployment_url && (
                      <span className="ml-2">
                        op{" "}
                        <a
                          href={fb.deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-text no-underline hover:underline"
                        >
                          preview
                        </a>
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
            <textarea
              value={feedbackBody}
              onChange={(e) => setFeedbackBody(e.target.value)}
              placeholder="Wat vind je van de preview? Iets wat je anders wilt?"
              rows={2}
              className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={sendingFeedback || !feedbackBody.trim()}
              className="self-end bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {sendingFeedback ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        <h2 className="text-sm font-semibold text-text mb-4">Updates</h2>
        {updates.length === 0 ? (
          <p className="text-sm text-text-muted">Nog geen updates.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {updates.map((u) => (
              <div
                key={u.id}
                className="border-l-2 border-border-light pl-4 py-1"
              >
                <p className="text-sm font-medium text-text">{u.title}</p>
                {u.body && (
                  <p className="text-sm text-text-secondary mt-1">{u.body}</p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {new Date(u.created_at).toLocaleDateString("nl-NL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
