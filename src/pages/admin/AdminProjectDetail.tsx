import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Eye, CheckCircle2, Clock, Loader2, Send, Star, MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminModal } from "@/components/admin/AdminModal";
import { notifyClientMembers } from "@/lib/notifications";
import type { Project, ProjectPhase, ReviewRound, PreviewFeedback, ProjectUpdate } from "@/types/portal";

const phaseBlurb: Record<ProjectPhase, string> = {
  discovery: "We leren jullie bedrijf kennen en bepalen de scope.",
  build: "We bouwen de eerste module, elke week een klik-ronde.",
  scale: "We zetten modules aan en optimaliseren.",
  completed: "Het systeem draait en is van jullie.",
};

const phases: { key: ProjectPhase; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "build", label: "Build" },
  { key: "scale", label: "Scale" },
  { key: "completed", label: "Afgerond" },
];

function phaseIndex(phase: ProjectPhase) {
  return phases.findIndex((p) => p.key === phase);
}

const statusIcons = { pending: Clock, active: Eye, completed: CheckCircle2 };
const statusLabels: Record<string, string> = { pending: "Klaarstaan", active: "Actief", completed: "Afgerond" };
const statusStyles: Record<string, string> = {
  pending: "bg-accent-soft text-text-muted",
  active: "bg-blue-bg text-blue",
  completed: "bg-green-bg text-green",
};

export function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [reviews, setReviews] = useState<ReviewRound[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [feedback, setFeedback] = useState<Record<string, PreviewFeedback[]>>({});
  const [loading, setLoading] = useState(true);

  // Edit project
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", phase: "discovery" as ProjectPhase, vercel_project_id: "", live_url: "" });
  const [savingProject, setSavingProject] = useState(false);

  // New review round
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ title: "", week_number: "", deployment_url: "", description: "", focus_areas: "", start_date: "", due_date: "" });
  const [savingReview, setSavingReview] = useState(false);

  // Feedback admin-antwoord
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [savingResponse, setSavingResponse] = useState<string | null>(null);

  // New update
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

  // Expanded review for feedback
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    const [projRes, reviewRes, updateRes, fbRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("review_rounds").select("*").eq("project_id", id).order("week_number", { ascending: false }),
      supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("preview_feedback").select("*").eq("project_id", id).order("created_at", { ascending: true }),
    ]);

    const p = projRes.data as Project | null;
    setProject(p);
    if (p) setEditForm({ title: p.title, description: p.description ?? "", phase: p.phase, vercel_project_id: p.vercel_project_id ?? "", live_url: p.live_url ?? "" });
    setReviews((reviewRes.data as ReviewRound[]) ?? []);
    setUpdates((updateRes.data as ProjectUpdate[]) ?? []);

    // Group feedback by review_round_id
    const fbMap: Record<string, PreviewFeedback[]> = {};
    for (const fb of (fbRes.data as PreviewFeedback[]) ?? []) {
      const key = fb.review_round_id ?? "legacy";
      if (!fbMap[key]) fbMap[key] = [];
      fbMap[key].push(fb);
    }
    setFeedback(fbMap);
    setLoading(false);
  }

  async function saveProject() {
    if (!id) return;
    setSavingProject(true);
    await supabase.from("projects").update({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      phase: editForm.phase,
      vercel_project_id: editForm.vercel_project_id.trim() || null,
      live_url: editForm.live_url.trim() || null,
    }).eq("id", id);
    setProject((prev) => prev ? { ...prev, ...editForm } : prev);
    setEditing(false);
    setSavingProject(false);
  }

  async function setPhase(phase: ProjectPhase) {
    if (!id || !project || phase === project.phase) return;
    await supabase.from("projects").update({ phase }).eq("id", id);

    const label = phases.find((p) => p.key === phase)?.label ?? phase;
    // Auto-bericht op de tijdlijn + melding naar de klant
    await supabase.from("project_updates").insert({
      project_id: id,
      title: `Nieuwe fase: ${label}`,
      body: phaseBlurb[phase],
    });
    await notifyClientMembers(project.client_id, {
      type: "phase_change",
      title: `Jullie project is nu in de fase "${label}"`,
      body: phaseBlurb[phase],
      link: "/portal/traject",
    });

    setProject((prev) => prev ? { ...prev, phase } : prev);
    setEditForm((prev) => ({ ...prev, phase }));
    loadData();
  }

  async function saveResponse(fb: PreviewFeedback) {
    const text = (responseDrafts[fb.id] ?? "").trim();
    if (!text || !project) return;
    setSavingResponse(fb.id);
    await supabase.from("preview_feedback").update({
      admin_response: text,
      responded_at: new Date().toISOString(),
      status: fb.status === "open" ? "acknowledged" : fb.status,
    }).eq("id", fb.id);
    await notifyClientMembers(project.client_id, {
      type: "feedback_answered",
      title: "De studio heeft op jullie feedback gereageerd",
      body: text.slice(0, 120),
      link: `/portal/projecten/${project.id}`,
    });
    setSavingResponse(null);
    setResponseDrafts((prev) => ({ ...prev, [fb.id]: "" }));
    loadData();
  }

  async function createReview(e: FormEvent) {
    e.preventDefault();
    if (!id || !reviewForm.title.trim() || !reviewForm.deployment_url.trim()) return;
    setSavingReview(true);

    const focusAreas = reviewForm.focus_areas.split(",").map((s) => s.trim()).filter(Boolean);

    await supabase.from("review_rounds").insert({
      project_id: id,
      title: reviewForm.title.trim(),
      week_number: parseInt(reviewForm.week_number) || 1,
      deployment_url: reviewForm.deployment_url.trim(),
      description: reviewForm.description.trim() || null,
      focus_areas: focusAreas.length > 0 ? focusAreas : [],
      start_date: reviewForm.start_date || null,
      due_date: reviewForm.due_date || null,
      status: "pending",
      notified_at: new Date().toISOString(),
    });

    if (project) {
      await notifyClientMembers(project.client_id, {
        type: "review_created",
        title: `Nieuwe klik-ronde: ${reviewForm.title.trim()}`,
        body: reviewForm.due_date
          ? `Bekijk de preview en geef feedback vóór ${new Date(reviewForm.due_date).toLocaleDateString("nl-NL")}.`
          : "Bekijk de preview en geef je feedback.",
        link: "/portal/traject",
      });
    }

    setShowReviewModal(false);
    setReviewForm({ title: "", week_number: "", deployment_url: "", description: "", focus_areas: "", start_date: "", due_date: "" });
    setSavingReview(false);
    loadData();
  }

  async function addUpdate(e: FormEvent) {
    e.preventDefault();
    if (!id || !updateTitle.trim()) return;
    setSavingUpdate(true);

    await supabase.from("project_updates").insert({
      project_id: id,
      title: updateTitle.trim(),
      body: updateBody.trim() || null,
    });

    setUpdateTitle("");
    setUpdateBody("");
    setSavingUpdate(false);
    loadData();
  }

  async function updateFeedbackStatus(fbId: string, status: string) {
    await supabase.from("preview_feedback").update({ status }).eq("id", fbId);
    loadData();
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
        <Link to="/admin/projecten" className="text-sm text-text mt-2 inline-block no-underline hover:underline">Terug</Link>
      </div>
    );
  }

  const currentPhase = phaseIndex(project.phase);

  return (
    <div>
      <Link to="/admin/projecten" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors">
        <ArrowLeft size={16} /> Terug
      </Link>

      {/* Project header */}
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">{project.title}</h1>
        <button
          onClick={() => editing ? saveProject() : setEditing(true)}
          disabled={savingProject}
          className="text-sm text-text-secondary hover:text-text transition-colors"
        >
          {savingProject ? "Opslaan..." : editing ? "Opslaan" : "Bewerken"}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Titel</label>
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Fase</label>
              <select value={editForm.phase} onChange={(e) => setEditForm({ ...editForm, phase: e.target.value as ProjectPhase })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors">
                {phases.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Vercel Project ID</label>
              <input value={editForm.vercel_project_id} onChange={(e) => setEditForm({ ...editForm, vercel_project_id: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Live URL</label>
              <input value={editForm.live_url} onChange={(e) => setEditForm({ ...editForm, live_url: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">Beschrijving</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* Phase stepper */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-4">Fase</h2>
        <div className="flex items-center gap-2">
          {phases.map((phase, i) => (
            <div key={phase.key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setPhase(phase.key)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                  i <= currentPhase ? "bg-text text-white" : "bg-accent-soft text-text-muted hover:bg-border"
                }`}
              >
                {i + 1}
              </button>
              <span className={`text-sm ${i <= currentPhase ? "text-text font-medium" : "text-text-muted"}`}>
                {phase.label}
              </span>
              {i < phases.length - 1 && (
                <div className={`flex-1 h-px ${i < currentPhase ? "bg-text" : "bg-border-light"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">{phaseBlurb[project.phase]}</p>
      </div>

      {/* Review rounds */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">Review rondes ({reviews.length})</h2>
          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <Plus size={14} /> Nieuwe ronde
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted">Nog geen review rondes.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((round) => {
              const Icon = statusIcons[round.status as keyof typeof statusIcons] ?? Clock;
              const roundFeedback = feedback[round.id] ?? [];
              const isExpanded = expandedReview === round.id;

              return (
                <div key={round.id} className="border border-border-light rounded-[8px]">
                  <button
                    onClick={() => setExpandedReview(isExpanded ? null : round.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent-soft/30 transition-colors"
                  >
                    <Icon size={18} className={statusStyles[round.status]?.split(" ").pop() ?? "text-text-muted"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{round.title}</p>
                      <p className="text-xs text-text-muted">Week {round.week_number} — {roundFeedback.length} feedback</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[round.status] ?? ""}`}>
                      {statusLabels[round.status] ?? round.status}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border-light p-3">
                      {round.deployment_url && (
                        <a href={round.deployment_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue hover:underline no-underline mb-3 block truncate">
                          {round.deployment_url}
                        </a>
                      )}
                      {roundFeedback.length === 0 ? (
                        <p className="text-xs text-text-muted">Geen feedback.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {roundFeedback.map((fb) => (
                            <div key={fb.id} className="flex items-start gap-3 p-2 rounded-[6px] bg-accent-soft/30">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  {fb.category && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-bg-white text-text-muted">{fb.category}</span>
                                  )}
                                  {fb.rating && (
                                    <span className="flex items-center gap-0.5">
                                      {Array.from({ length: fb.rating }).map((_, i) => (
                                        <Star key={i} size={10} className="text-[#f59e0b] fill-[#f59e0b]" />
                                      ))}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-text">{fb.body}</p>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {new Date(fb.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                                {fb.admin_response ? (
                                  <div className="mt-2 flex items-start gap-2 p-2 rounded-[6px] bg-blue-bg">
                                    <MessageSquare size={13} className="text-blue mt-0.5 shrink-0" />
                                    <p className="text-xs text-text">{fb.admin_response}</p>
                                  </div>
                                ) : (
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      value={responseDrafts[fb.id] ?? ""}
                                      onChange={(e) => setResponseDrafts((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                                      placeholder="Reageer naar de klant…"
                                      className="flex-1 text-xs rounded-[6px] border border-border-light bg-bg-white px-2 py-1.5 outline-none focus:border-text"
                                    />
                                    <button
                                      onClick={() => saveResponse(fb)}
                                      disabled={savingResponse === fb.id || !(responseDrafts[fb.id] ?? "").trim()}
                                      className="text-xs font-semibold bg-text text-white rounded-[6px] px-2.5 py-1.5 disabled:opacity-40"
                                    >
                                      {savingResponse === fb.id ? "…" : "Stuur"}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <select
                                value={fb.status}
                                onChange={(e) => updateFeedbackStatus(fb.id, e.target.value)}
                                className="text-xs rounded-[6px] border border-border-light bg-bg px-2 py-1 outline-none"
                              >
                                <option value="open">Open</option>
                                <option value="acknowledged">Gezien</option>
                                <option value="resolved">Opgelost</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project updates */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-4">Updates ({updates.length})</h2>

        <form onSubmit={addUpdate} className="flex gap-2 mb-4">
          <input
            value={updateTitle}
            onChange={(e) => setUpdateTitle(e.target.value)}
            placeholder="Update titel..."
            className="flex-1 rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
          />
          <button
            type="submit"
            disabled={savingUpdate || !updateTitle.trim()}
            className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {savingUpdate ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Toevoegen
          </button>
        </form>

        {updates.length === 0 ? (
          <p className="text-sm text-text-muted">Nog geen updates.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {updates.map((u) => (
              <div key={u.id} className="border-l-2 border-border-light pl-4 py-1">
                <p className="text-sm font-medium text-text">{u.title}</p>
                {u.body && <p className="text-sm text-text-secondary mt-0.5">{u.body}</p>}
                <p className="text-xs text-text-muted mt-1">{new Date(u.created_at).toLocaleDateString("nl-NL")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review round modal */}
      <AdminModal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Nieuwe review ronde">
        <form onSubmit={createReview} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
            <input required value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="bv. Homepage redesign"
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Week nummer *</label>
              <input type="number" required min={1} value={reviewForm.week_number}
                onChange={(e) => setReviewForm({ ...reviewForm, week_number: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Focus gebieden</label>
              <input value={reviewForm.focus_areas} onChange={(e) => setReviewForm({ ...reviewForm, focus_areas: e.target.value })}
                placeholder="Navigatie, Mobiel, ..."
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Startdatum</label>
              <input type="date" value={reviewForm.start_date} onChange={(e) => setReviewForm({ ...reviewForm, start_date: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Feedback vóór</label>
              <input type="date" value={reviewForm.due_date} onChange={(e) => setReviewForm({ ...reviewForm, due_date: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Deployment URL *</label>
            <input required value={reviewForm.deployment_url} onChange={(e) => setReviewForm({ ...reviewForm, deployment_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Beschrijving</label>
            <textarea value={reviewForm.description} onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
              rows={2} placeholder="Waar moet de klant op letten?"
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors resize-none" />
          </div>
          <button type="submit" disabled={savingReview}
            className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">
            {savingReview ? "Opslaan..." : "Aanmaken"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
