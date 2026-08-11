import { useEffect, useState, Fragment, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Plus, CheckCircle2, Loader2, Send, Star, MessageSquare,
  ChevronUp, ChevronDown, Pencil, Trash2, ExternalLink, ChevronDown as Caret,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminModal } from "@/components/admin/AdminModal";
import { notifyClientMembers } from "@/lib/notifications";
import { MODULE_STATUS, MODULE_STATUS_OPTIONS, MODULE_ICON_NAMES, MODULE_KIND, moduleIcon, formatMonthly, normalizeModuleKind } from "@/lib/modules";
import { seedDefaultSteps } from "@/lib/journey";
import type { Project, ProjectPhase, ReviewRound, PreviewFeedback, ProjectUpdate, Module, ModuleStatus, ModuleKind, ProjectCost, WorkflowStep, WorkflowStepStatus, AgentActivity } from "@/types/portal";

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

const statusLabels: Record<string, string> = { pending: "Klaarstaan", active: "Actief", completed: "Afgerond" };
const statusStyles: Record<string, string> = {
  pending: "bg-accent-soft text-text-muted",
  active: "bg-blue-bg text-blue",
  completed: "bg-green-bg text-green",
};

const STEP_STATUS: { value: WorkflowStepStatus; label: string }[] = [
  { value: "pending", label: "Gepland" },
  { value: "in_progress", label: "Nu bezig" },
  { value: "completed", label: "Afgerond" },
  { value: "blocked", label: "Geblokkeerd" },
];
const stepStatusBadge: Record<WorkflowStepStatus, string> = {
  pending: "bg-accent-soft text-text-muted",
  in_progress: "bg-blue-bg text-blue",
  completed: "bg-green-bg text-green",
  blocked: "bg-[#fef2f2] text-[#ef4444]",
};

type Tab = "voortgang" | "modules" | "agents" | "reviews" | "kosten";
const TABS: { key: Tab; label: string }[] = [
  { key: "voortgang", label: "Voortgang" },
  { key: "modules", label: "Modules" },
  { key: "agents", label: "Agents" },
  { key: "reviews", label: "Reviews" },
  { key: "kosten", label: "Kosten" },
];

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("voortgang");
  const [project, setProject] = useState<Project | null>(null);
  const [reviews, setReviews] = useState<ReviewRound[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [feedback, setFeedback] = useState<Record<string, PreviewFeedback[]>>({});
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit project
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", phase: "discovery" as ProjectPhase, vercel_project_id: "", live_url: "" });
  const [savingProject, setSavingProject] = useState(false);

  // Modules
  const [modules, setModules] = useState<Module[]>([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ name: "", description: "", status: "planned" as ModuleStatus, kind: "system" as ModuleKind, monthly_price: "", preview_url: "", icon: "" });
  const [savingModule, setSavingModule] = useState(false);

  // Agent-activiteit
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [activityForm, setActivityForm] = useState({ module_id: "", occurred_on: "", summary: "" });
  const [savingActivity, setSavingActivity] = useState(false);
  const [dropDraft, setDropDraft] = useState({ title: "", body: "" });
  const [postingAgentDrop, setPostingAgentDrop] = useState(false);

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
  const [updateKind, setUpdateKind] = useState<"update" | "drop">("update");
  const [updateLink, setUpdateLink] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

  // Kosten
  const [costForm, setCostForm] = useState({ description: "", amount: "", is_overrun: false });
  const [savingCost, setSavingCost] = useState(false);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [costEditForm, setCostEditForm] = useState({ description: "", amount: "", is_overrun: false });

  // Route (workflow_steps)
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState({ title: "", description: "", owner: "studio" as "studio" | "client", status: "pending" as WorkflowStepStatus, due_date: "" });
  const [savingStep, setSavingStep] = useState(false);
  const [seedingSteps, setSeedingSteps] = useState(false);

  // Expanded review for feedback
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    const [projRes, modRes, reviewRes, updateRes, fbRes, costRes, stepRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("modules").select("*").eq("project_id", id).order("sequence_order"),
      supabase.from("review_rounds").select("*").eq("project_id", id).order("week_number", { ascending: false }),
      supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("preview_feedback").select("*").eq("project_id", id).order("created_at", { ascending: true }),
      supabase.from("project_costs").select("*").eq("project_id", id).order("sequence_order"),
      supabase.from("workflow_steps").select("*").eq("project_id", id).order("sequence_order"),
    ]);

    const p = projRes.data as Project | null;
    setProject(p);
    if (p) setEditForm({ title: p.title, description: p.description ?? "", phase: p.phase, vercel_project_id: p.vercel_project_id ?? "", live_url: p.live_url ?? "" });
    const mods = (modRes.data as Module[]) ?? [];
    setModules(mods);
    setReviews((reviewRes.data as ReviewRound[]) ?? []);
    setUpdates((updateRes.data as ProjectUpdate[]) ?? []);
    setCosts((costRes.data as ProjectCost[]) ?? []);
    setSteps((stepRes.data as WorkflowStep[]) ?? []);

    const agentIds = mods.filter((m) => normalizeModuleKind(m.kind) === "agent").map((m) => m.id);
    if (agentIds.length > 0) {
      const { data: actData } = await supabase.from("agent_activities").select("*")
        .in("module_id", agentIds).order("occurred_on", { ascending: false }).order("created_at", { ascending: false });
      setActivities((actData as AgentActivity[]) ?? []);
    } else {
      setActivities([]);
    }

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
    await supabase.from("project_updates").insert({ project_id: id, title: `Nieuwe fase: ${label}`, body: phaseBlurb[phase] });
    await notifyClientMembers(project.client_id, {
      type: "phase_change", title: `Jullie project is nu in de fase "${label}"`, body: phaseBlurb[phase], link: "/portal/project",
    });
    setProject((prev) => prev ? { ...prev, phase } : prev);
    setEditForm((prev) => ({ ...prev, phase }));
    loadData();
  }

  // ─── Modules ───
  function openNewModule() {
    setEditingModuleId(null);
    setModuleForm({ name: "", description: "", status: "planned", kind: "system", monthly_price: "", preview_url: "", icon: "" });
    setShowModuleModal(true);
  }
  function openEditModule(m: Module) {
    setEditingModuleId(m.id);
    setModuleForm({
      name: m.name, description: m.description ?? "", status: m.status,
      kind: normalizeModuleKind(m.kind),
      monthly_price: m.monthly_price_cents != null ? (m.monthly_price_cents / 100).toFixed(2).replace(".", ",") : "",
      preview_url: m.preview_url ?? "", icon: m.icon ?? "",
    });
    setShowModuleModal(true);
  }
  async function saveModule(e: FormEvent) {
    e.preventDefault();
    if (!id || !project || !moduleForm.name.trim()) return;
    setSavingModule(true);
    const monthlyCents = moduleForm.kind === "agent" && moduleForm.monthly_price.trim()
      ? Math.round((parseFloat(moduleForm.monthly_price.replace(",", ".")) || 0) * 100)
      : null;
    const payload = {
      name: moduleForm.name.trim(),
      description: moduleForm.description.trim() || null,
      status: moduleForm.status,
      kind: moduleForm.kind,
      monthly_price_cents: monthlyCents,
      preview_url: moduleForm.preview_url.trim() || null,
      icon: moduleForm.icon || null,
    };
    if (editingModuleId) {
      const prev = modules.find((m) => m.id === editingModuleId);
      await supabase.from("modules").update(payload).eq("id", editingModuleId);
      if (prev && prev.status !== moduleForm.status) {
        await supabase.from("project_updates").insert({ project_id: id, title: `Module "${payload.name}" is nu ${MODULE_STATUS[moduleForm.status].label.toLowerCase()}` });
        await notifyClientMembers(project.client_id, {
          type: "module_status", title: `Module "${payload.name}" is nu ${MODULE_STATUS[moduleForm.status].label.toLowerCase()}`,
          body: payload.description ?? undefined, link: `/portal/projecten/${id}`,
        });
      }
    } else {
      await supabase.from("modules").insert({ ...payload, project_id: id, client_id: project.client_id, sequence_order: modules.length });
    }
    setShowModuleModal(false);
    setSavingModule(false);
    loadData();
  }
  async function deleteModule(m: Module) {
    if (!window.confirm(`Module "${m.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    await supabase.from("modules").delete().eq("id", m.id);
    loadData();
  }
  async function moveModule(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= modules.length) return;
    const a = modules[index], b = modules[other];
    await Promise.all([
      supabase.from("modules").update({ sequence_order: b.sequence_order }).eq("id", a.id),
      supabase.from("modules").update({ sequence_order: a.sequence_order }).eq("id", b.id),
    ]);
    loadData();
  }

  // ─── Route (workflow_steps) ───
  function openNewStep() {
    setEditingStepId(null);
    setStepForm({ title: "", description: "", owner: "studio", status: "pending", due_date: "" });
    setShowStepModal(true);
  }
  function openEditStep(s: WorkflowStep) {
    setEditingStepId(s.id);
    setStepForm({ title: s.title, description: s.description ?? "", owner: s.owner, status: s.status, due_date: s.due_date ?? "" });
    setShowStepModal(true);
  }
  async function saveStep(e: FormEvent) {
    e.preventDefault();
    if (!id || !project || !stepForm.title.trim()) return;
    setSavingStep(true);
    const payload = {
      title: stepForm.title.trim(),
      description: stepForm.description.trim() || null,
      owner: stepForm.owner,
      status: stepForm.status,
      due_date: stepForm.due_date || null,
      completed_at: stepForm.status === "completed" ? new Date().toISOString() : null,
    };
    if (editingStepId) {
      const prev = steps.find((s) => s.id === editingStepId);
      await supabase.from("workflow_steps").update({
        ...payload,
        completed_at: stepForm.status === "completed" ? (prev?.completed_at ?? payload.completed_at) : null,
      }).eq("id", editingStepId);
    } else {
      await supabase.from("workflow_steps").insert({
        ...payload, project_id: id, client_id: project.client_id, category: "build", sequence_order: steps.length,
      });
    }
    setShowStepModal(false);
    setSavingStep(false);
    loadData();
  }
  async function setStepStatus(s: WorkflowStep, status: WorkflowStepStatus) {
    await supabase.from("workflow_steps").update({
      status, completed_at: status === "completed" ? (s.completed_at ?? new Date().toISOString()) : null,
    }).eq("id", s.id);
    loadData();
  }
  async function deleteStep(s: WorkflowStep) {
    if (!window.confirm(`Stap "${s.title}" verwijderen? De klant ziet deze dan niet meer in de route.`)) return;
    await supabase.from("workflow_steps").delete().eq("id", s.id);
    loadData();
  }
  async function moveStep(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= steps.length) return;
    const a = steps[index], b = steps[other];
    await Promise.all([
      supabase.from("workflow_steps").update({ sequence_order: b.sequence_order }).eq("id", a.id),
      supabase.from("workflow_steps").update({ sequence_order: a.sequence_order }).eq("id", b.id),
    ]);
    loadData();
  }
  async function seedRoute() {
    if (!id || !project) return;
    setSeedingSteps(true);
    await seedDefaultSteps(id, project.client_id);
    setSeedingSteps(false);
    loadData();
  }

  // ─── Agent-activiteit ───
  async function addActivity(e: FormEvent) {
    e.preventDefault();
    if (!project || !activityForm.summary.trim()) return;
    const agentModules = modules.filter((m) => normalizeModuleKind(m.kind) === "agent");
    const moduleId = activityForm.module_id || agentModules[0]?.id;
    if (!moduleId) return;
    setSavingActivity(true);
    await supabase.from("agent_activities").insert({
      module_id: moduleId,
      client_id: project.client_id,
      occurred_on: activityForm.occurred_on || new Date().toISOString().slice(0, 10),
      summary: activityForm.summary.trim(),
    });
    setActivityForm((prev) => ({ ...prev, summary: "" }));
    setSavingActivity(false);
    loadData();
  }
  async function deleteActivity(a: AgentActivity) {
    if (!window.confirm("Deze activiteit verwijderen?")) return;
    await supabase.from("agent_activities").delete().eq("id", a.id);
    loadData();
  }
  /** Vult de weekdrop-velden met de activiteiten van de afgelopen 7 dagen. */
  function generateWeekdropDraft() {
    const agentModules = modules.filter((m) => normalizeModuleKind(m.kind) === "agent");
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const recent = activities.filter((a) => new Date(a.occurred_on).getTime() >= weekAgo);
    const lines = recent.map((a) => {
      const mod = agentModules.find((m) => m.id === a.module_id);
      const date = new Date(a.occurred_on).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
      return `• ${mod ? `${mod.name}: ` : ""}${a.summary} (${date})`;
    });
    const title = agentModules.length === 1
      ? `Wat ${agentModules[0].name} deze week deed`
      : "Wat je agents deze week deden";
    setDropDraft({ title, body: lines.join("\n") });
  }
  async function postAgentDrop(e: FormEvent) {
    e.preventDefault();
    if (!id || !project || !dropDraft.title.trim()) return;
    setPostingAgentDrop(true);
    await supabase.from("project_updates").insert({
      project_id: id, title: dropDraft.title.trim(), body: dropDraft.body.trim() || null, kind: "drop", link: null,
    });
    await notifyClientMembers(project.client_id, {
      type: "weekly_drop", title: `Deze week gebouwd: ${dropDraft.title.trim()}`,
      body: dropDraft.body.trim().slice(0, 120) || undefined, link: `/portal/projecten/${id}?tab=voortgang`,
    });
    setDropDraft({ title: "", body: "" });
    setPostingAgentDrop(false);
    loadData();
  }

  async function saveResponse(fb: PreviewFeedback) {
    const text = (responseDrafts[fb.id] ?? "").trim();
    if (!text || !project) return;
    setSavingResponse(fb.id);
    await supabase.from("preview_feedback").update({
      admin_response: text, responded_at: new Date().toISOString(), status: fb.status === "open" ? "acknowledged" : fb.status,
    }).eq("id", fb.id);
    await notifyClientMembers(project.client_id, {
      type: "feedback_answered", title: "De studio heeft op jullie feedback gereageerd", body: text.slice(0, 120), link: `/portal/projecten/${project.id}`,
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
      project_id: id, title: reviewForm.title.trim(), week_number: parseInt(reviewForm.week_number) || 1,
      deployment_url: reviewForm.deployment_url.trim(), description: reviewForm.description.trim() || null,
      focus_areas: focusAreas.length > 0 ? focusAreas : [], start_date: reviewForm.start_date || null,
      due_date: reviewForm.due_date || null, status: "pending", notified_at: new Date().toISOString(),
    });
    if (project) {
      await notifyClientMembers(project.client_id, {
        type: "review_created", title: `Nieuwe klik-ronde: ${reviewForm.title.trim()}`,
        body: reviewForm.due_date ? `Bekijk de preview en geef feedback vóór ${new Date(reviewForm.due_date).toLocaleDateString("nl-NL")}.` : "Bekijk de preview en geef je feedback.",
        link: "/portal/project",
      });
    }
    setShowReviewModal(false);
    setReviewForm({ title: "", week_number: "", deployment_url: "", description: "", focus_areas: "", start_date: "", due_date: "" });
    setSavingReview(false);
    loadData();
  }

  async function addUpdate(e: FormEvent) {
    e.preventDefault();
    if (!id || !project || !updateTitle.trim()) return;
    setSavingUpdate(true);
    await supabase.from("project_updates").insert({
      project_id: id, title: updateTitle.trim(), body: updateBody.trim() || null, kind: updateKind, link: updateLink.trim() || null,
    });
    if (updateKind === "drop") {
      await notifyClientMembers(project.client_id, {
        type: "weekly_drop", title: `Deze week gebouwd: ${updateTitle.trim()}`, body: updateBody.trim() || undefined, link: `/portal/projecten/${id}?tab=voortgang`,
      });
    }
    setUpdateTitle(""); setUpdateBody(""); setUpdateLink(""); setUpdateKind("update");
    setSavingUpdate(false);
    loadData();
  }

  async function updateFeedbackStatus(fbId: string, status: string) {
    await supabase.from("preview_feedback").update({ status }).eq("id", fbId);
    loadData();
  }

  // ─── Kosten ───
  async function addCost(e: FormEvent) {
    e.preventDefault();
    if (!id || !project || !costForm.description.trim()) return;
    setSavingCost(true);
    const cents = Math.round((parseFloat(costForm.amount.replace(",", ".")) || 0) * 100);
    await supabase.from("project_costs").insert({
      project_id: id, client_id: project.client_id, description: costForm.description.trim(),
      amount_cents: cents, is_overrun: costForm.is_overrun, sequence_order: costs.length,
    });
    setCostForm({ description: "", amount: "", is_overrun: false });
    setSavingCost(false);
    loadData();
  }
  async function deleteCost(c: ProjectCost) {
    if (!window.confirm(`Kostenregel "${c.description}" verwijderen?`)) return;
    await supabase.from("project_costs").delete().eq("id", c.id);
    loadData();
  }
  function openEditCost(c: ProjectCost) {
    setEditingCostId(c.id);
    setCostEditForm({ description: c.description, amount: (c.amount_cents / 100).toFixed(2).replace(".", ","), is_overrun: c.is_overrun });
  }
  async function saveCostEdit() {
    if (!editingCostId || !costEditForm.description.trim()) return;
    const cents = Math.round((parseFloat(costEditForm.amount.replace(",", ".")) || 0) * 100);
    await supabase.from("project_costs").update({
      description: costEditForm.description.trim(), amount_cents: cents, is_overrun: costEditForm.is_overrun,
    }).eq("id", editingCostId);
    setEditingCostId(null);
    loadData();
  }
  async function moveCost(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= costs.length) return;
    const a = costs[index], b = costs[other];
    await Promise.all([
      supabase.from("project_costs").update({ sequence_order: b.sequence_order }).eq("id", a.id),
      supabase.from("project_costs").update({ sequence_order: a.sequence_order }).eq("id", b.id),
    ]);
    loadData();
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
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
  const anyModuleBuildingOrLive = modules.some((m) => m.status === "building" || m.status === "live");
  const anyModuleLive = modules.some((m) => m.status === "live");
  const anyReviewDone = reviews.some((r) => r.status === "completed");
  const prefFeedback = Object.values(feedback).flat().find((f) => f.body?.startsWith("Voorkeur van de klant"));
  const prefModuleName = prefFeedback?.module_id ? modules.find((m) => m.id === prefFeedback.module_id)?.name : undefined;
  const journeySteps = [
    { label: "Intake verwerkt", done: true },
    { label: "Kickoff & eerste module", done: anyModuleBuildingOrLive || !!prefFeedback },
    { label: "Eerste klik-ronde", done: anyReviewDone },
    { label: "Eerste module live", done: anyModuleLive },
  ];
  const costTotal = costs.reduce((s, c) => s + c.amount_cents, 0);
  const overrunTotal = costs.filter((c) => c.is_overrun).reduce((s, c) => s + c.amount_cents, 0);
  const agentModules = modules.filter((m) => normalizeModuleKind(m.kind) === "agent");
  const monthlyTotal = agentModules.reduce((s, m) => s + (m.monthly_price_cents ?? 0), 0);
  const visibleTabs = agentModules.length > 0 ? TABS : TABS.filter((t) => t.key !== "agents");
  const counts: Record<Tab, number> = { voortgang: 0, modules: modules.length, agents: agentModules.length, reviews: reviews.length, kosten: costs.length };

  return (
    <div>
      <Link to="/admin/projecten" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors">
        <ArrowLeft size={16} /> Terug
      </Link>

      {/* Project header */}
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-2xl font-bold text-text">{project.title}</h1>
        <button onClick={() => editing ? saveProject() : setEditing(true)} disabled={savingProject}
          className="text-sm text-text-secondary hover:text-text transition-colors">
          {savingProject ? "Opslaan..." : editing ? "Opslaan" : "Bewerken"}
        </button>
      </div>

      {editing && (
        <div className="rounded-[12px] border border-border-light bg-bg-white p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Labeled label="Titel"><input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Fase">
              <select value={editForm.phase} onChange={(e) => setEditForm({ ...editForm, phase: e.target.value as ProjectPhase })} className={inputCls}>
                {phases.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </Labeled>
            <Labeled label="Vercel Project ID"><input value={editForm.vercel_project_id} onChange={(e) => setEditForm({ ...editForm, vercel_project_id: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Live URL"><input value={editForm.live_url} onChange={(e) => setEditForm({ ...editForm, live_url: e.target.value })} className={inputCls} /></Labeled>
            <div className="sm:col-span-2">
              <Labeled label="Beschrijving"><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} /></Labeled>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border-light mb-6 overflow-x-auto">
        {visibleTabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-text text-text" : "border-transparent text-text-muted hover:text-text"}`}>
            {t.label}
            {counts[t.key] > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-soft text-text-secondary">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* ─── VOORTGANG ─── */}
      {tab === "voortgang" && (
        <div className="flex flex-col gap-8">
          {/* Fase */}
          <section>
            <h2 className="text-sm font-semibold text-text mb-3">Fase</h2>
            <div className="flex items-center gap-2">
              {phases.map((phase, i) => (
                <div key={phase.key} className="flex items-center gap-2 flex-1">
                  <button onClick={() => setPhase(phase.key)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                      i <= currentPhase ? "bg-text text-white" : "bg-accent-soft text-text-muted hover:bg-border"}`}>
                    {i + 1}
                  </button>
                  <span className={`text-sm ${i <= currentPhase ? "text-text font-medium" : "text-text-muted"}`}>{phase.label}</span>
                  {i < phases.length - 1 && <div className={`flex-1 h-px ${i < currentPhase ? "bg-text" : "bg-border-light"}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">{phaseBlurb[project.phase]}</p>
          </section>

          {/* Reis-status */}
          <section>
            <h2 className="text-sm font-semibold text-text mb-3">Reis-status <span className="text-text-muted font-normal">· waar zit de klant</span></h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {journeySteps.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  {s.done ? <CheckCircle2 size={16} className="text-green shrink-0" /> : <span className="w-4 h-4 rounded-full border-2 border-border shrink-0" />}
                  <span className={`text-sm ${s.done ? "text-text" : "text-text-muted"}`}>{s.label}</span>
                </div>
              ))}
            </div>
            {prefModuleName && !anyModuleBuildingOrLive && (
              <p className="text-xs text-blue mt-3 flex items-center gap-1.5"><Star size={13} /> Klant wil starten met: <span className="font-semibold">{prefModuleName}</span></p>
            )}
          </section>

          {/* Route - wat de klant als "De route" ziet, hier volledig bewerkbaar */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text">Route <span className="text-text-muted font-normal">· de stappen die de klant ziet</span></h2>
              <button onClick={openNewStep} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"><Plus size={14} /> Stap toevoegen</button>
            </div>
            {steps.length === 0 ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-text-muted">Nog geen route. De klant ziet dan geen stappenplan.</p>
                <button onClick={seedRoute} disabled={seedingSteps} className="text-sm font-medium text-text underline-offset-2 hover:underline disabled:opacity-50">
                  {seedingSteps ? "Bezig..." : "Standaardroute toevoegen"}
                </button>
              </div>
            ) : (
              <TableShell head={<><Th className="w-8"></Th><Th>Stap</Th><Th>Eigenaar</Th><Th>Status</Th><Th>Streefdatum</Th><Th className="text-right">Acties</Th></>}>
                {steps.map((s, i) => (
                  <tr key={s.id} className="hover:bg-bg align-middle">
                    <Td>
                      <div className="flex flex-col">
                        <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-text-muted hover:text-text disabled:opacity-30" aria-label="Omhoog"><ChevronUp size={13} /></button>
                        <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="text-text-muted hover:text-text disabled:opacity-30" aria-label="Omlaag"><ChevronDown size={13} /></button>
                      </div>
                    </Td>
                    <Td>
                      <p className={`text-sm font-medium ${s.status === "completed" ? "text-text-muted line-through" : "text-text"}`}>{s.title}</p>
                      {s.description && <p className="text-xs text-text-muted truncate max-w-[260px]">{s.description}</p>}
                    </Td>
                    <Td>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${s.owner === "client" ? "bg-blue-bg text-blue" : "bg-accent-soft text-text-muted"}`}>
                        {s.owner === "client" ? "Klant" : "Studio"}
                      </span>
                    </Td>
                    <Td>
                      <select value={s.status} onChange={(e) => setStepStatus(s, e.target.value as WorkflowStepStatus)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 outline-none border-0 cursor-pointer ${stepStatusBadge[s.status]}`}>
                        {STEP_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Td>
                    <Td className="text-xs text-text-muted whitespace-nowrap">{s.due_date ? new Date(s.due_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "-"}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => openEditStep(s)} className="text-text-muted hover:text-text p-1" aria-label="Bewerken"><Pencil size={14} /></button>
                      <button onClick={() => deleteStep(s)} className="text-text-muted hover:text-[#ef4444] p-1" aria-label="Verwijderen"><Trash2 size={14} /></button>
                    </Td>
                  </tr>
                ))}
              </TableShell>
            )}
          </section>

          {/* Updates & drops */}
          <section>
            <h2 className="text-sm font-semibold text-text mb-3">Updates & drops</h2>
            <form onSubmit={addUpdate} className="flex flex-col gap-2 mb-4 p-3 rounded-[8px] bg-bg border border-border-light">
              <div className="flex gap-2">
                <div className="inline-flex rounded-[8px] border border-border-light overflow-hidden shrink-0">
                  <button type="button" onClick={() => setUpdateKind("update")} className={`px-3 py-2 text-sm font-medium transition-colors ${updateKind === "update" ? "bg-text text-white" : "bg-bg-white text-text-secondary hover:text-text"}`}>Update</button>
                  <button type="button" onClick={() => setUpdateKind("drop")} className={`px-3 py-2 text-sm font-medium transition-colors ${updateKind === "drop" ? "bg-text text-white" : "bg-bg-white text-text-secondary hover:text-text"}`}>Wekelijkse drop</button>
                </div>
                <input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder={updateKind === "drop" ? "Bijv. Week 3: klok-scherm werkt" : "Update titel..."} className={`${inputCls} bg-bg-white flex-1`} />
              </div>
              <textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} rows={2} placeholder={updateKind === "drop" ? "Wat is er deze week gebouwd, in gewone taal?" : "Toelichting (optioneel)"} className={`${inputCls} bg-bg-white resize-none`} />
              <div className="flex gap-2">
                <input value={updateLink} onChange={(e) => setUpdateLink(e.target.value)} placeholder="Link naar preview of Loom-video (optioneel)" className={`${inputCls} bg-bg-white flex-1`} />
                <button type="submit" disabled={savingUpdate || !updateTitle.trim()} className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                  {savingUpdate ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {updateKind === "drop" ? "Drop plaatsen" : "Toevoegen"}
                </button>
              </div>
            </form>
            {updates.length === 0 ? (
              <p className="text-sm text-text-muted">Nog geen updates.</p>
            ) : (
              <TableShell head={<><Th>Type</Th><Th>Titel</Th><Th className="text-right">Datum</Th></>}>
                {updates.map((u) => (
                  <tr key={u.id} className="hover:bg-bg align-top">
                    <Td>{u.kind === "drop" ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-bg text-blue">DROP</span> : <span className="text-xs text-text-muted">Update</span>}</Td>
                    <Td>
                      <p className="text-sm font-medium text-text">{u.title}</p>
                      {u.body && <p className="text-xs text-text-muted mt-0.5">{u.body}</p>}
                      {u.link && <a href={u.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline no-underline">Bekijk link →</a>}
                    </Td>
                    <Td className="text-right text-xs text-text-muted whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("nl-NL")}</Td>
                  </tr>
                ))}
              </TableShell>
            )}
          </section>
        </div>
      )}

      {/* ─── MODULES ─── */}
      {tab === "modules" && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text">Modules</h2>
            <button onClick={openNewModule} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"><Plus size={14} /> Module toevoegen</button>
          </div>
          {modules.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen modules. Voeg de onderdelen van dit systeem toe.</p>
          ) : (
            <TableShell head={<><Th className="w-8"></Th><Th>Naam</Th><Th>Status</Th><Th>Preview</Th><Th className="text-right">Acties</Th></>}>
              {modules.map((m, i) => {
                const st = MODULE_STATUS[m.status];
                const kind = normalizeModuleKind(m.kind);
                const Icon = moduleIcon(m.icon, kind);
                return (
                  <tr key={m.id} className="hover:bg-bg align-middle">
                    <Td>
                      <div className="flex flex-col">
                        <button onClick={() => moveModule(i, -1)} disabled={i === 0} className="text-text-muted hover:text-text disabled:opacity-30" aria-label="Omhoog"><ChevronUp size={13} /></button>
                        <button onClick={() => moveModule(i, 1)} disabled={i === modules.length - 1} className="text-text-muted hover:text-text disabled:opacity-30" aria-label="Omlaag"><ChevronDown size={13} /></button>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${kind === "agent" ? "bg-[#f3e8ff]" : "bg-accent-soft"}`}><Icon size={15} className={kind === "agent" ? "text-[#7c3aed]" : "text-text"} /></div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-text">{m.name}</p>
                            {kind === "agent" && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MODULE_KIND.agent.badge}`}>Agent</span>}
                          </div>
                          {m.description && <p className="text-xs text-text-muted truncate max-w-[240px]">{m.description}</p>}
                          {kind === "agent" && m.monthly_price_cents != null && <p className="text-xs font-medium text-[#7c3aed]">{formatMonthly(m.monthly_price_cents)} vanaf live</p>}
                        </div>
                      </div>
                    </Td>
                    <Td><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}>{st.label}</span></Td>
                    <Td>{m.preview_url ? <a href={m.preview_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text"><ExternalLink size={15} /></a> : <span className="text-text-muted">-</span>}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => openEditModule(m)} className="text-text-muted hover:text-text p-1" aria-label="Bewerken"><Pencil size={14} /></button>
                      <button onClick={() => deleteModule(m)} className="text-text-muted hover:text-[#ef4444] p-1" aria-label="Verwijderen"><Trash2 size={14} /></button>
                    </Td>
                  </tr>
                );
              })}
            </TableShell>
          )}
        </section>
      )}

      {/* ─── AGENTS ─── */}
      {tab === "agents" && (
        <div className="flex flex-col gap-8">
          {/* Activiteit loggen */}
          <section>
            <h2 className="text-sm font-semibold text-text mb-1">Agent-activiteit</h2>
            <p className="text-xs text-text-muted mb-4">Wat deden de agents? De klant ziet dit op de module-pagina — en je bundelt het hieronder in één klik tot de weekdrop.</p>
            <form onSubmit={addActivity} className="flex flex-col sm:flex-row gap-2 mb-4 p-3 rounded-[8px] bg-bg border border-border-light">
              {agentModules.length > 1 && (
                <select value={activityForm.module_id} onChange={(e) => setActivityForm({ ...activityForm, module_id: e.target.value })} className={`${inputCls} bg-bg-white w-full sm:w-44 shrink-0`}>
                  {agentModules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              )}
              <input type="date" value={activityForm.occurred_on} onChange={(e) => setActivityForm({ ...activityForm, occurred_on: e.target.value })} className={`${inputCls} bg-bg-white w-full sm:w-40 shrink-0`} />
              <input value={activityForm.summary} onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })} placeholder="Bijv. 34 facturen verwerkt en gekoppeld" className={`${inputCls} bg-bg-white flex-1`} />
              <button type="submit" disabled={savingActivity || !activityForm.summary.trim()} className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0">
                {savingActivity ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Loggen
              </button>
            </form>
            {activities.length === 0 ? (
              <p className="text-sm text-text-muted">Nog geen activiteit gelogd.</p>
            ) : (
              <TableShell head={<><Th>Datum</Th><Th>Agent</Th><Th>Activiteit</Th><Th className="text-right">Acties</Th></>}>
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-bg align-middle">
                    <Td className="text-xs text-text-muted whitespace-nowrap">{new Date(a.occurred_on).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</Td>
                    <Td className="text-sm text-text-secondary whitespace-nowrap">{agentModules.find((m) => m.id === a.module_id)?.name ?? "—"}</Td>
                    <Td className="text-sm text-text">{a.summary}</Td>
                    <Td className="text-right"><button onClick={() => deleteActivity(a)} className="text-text-muted hover:text-[#ef4444] p-1" aria-label="Verwijderen"><Trash2 size={14} /></button></Td>
                  </tr>
                ))}
              </TableShell>
            )}
          </section>

          {/* Weekdrop uit activiteit */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text">Weekdrop uit activiteit</h2>
              <button type="button" onClick={generateWeekdropDraft} className="text-sm text-text-secondary hover:text-text transition-colors">Vul met afgelopen 7 dagen</button>
            </div>
            <form onSubmit={postAgentDrop} className="flex flex-col gap-2 p-3 rounded-[8px] bg-bg border border-border-light">
              <input value={dropDraft.title} onChange={(e) => setDropDraft({ ...dropDraft, title: e.target.value })} placeholder="Titel van de drop…" className={`${inputCls} bg-bg-white`} />
              <textarea value={dropDraft.body} onChange={(e) => setDropDraft({ ...dropDraft, body: e.target.value })} rows={4} placeholder="Klik op 'Vul met afgelopen 7 dagen' of schrijf zelf…" className={`${inputCls} bg-bg-white resize-y`} />
              <div className="flex justify-end">
                <button type="submit" disabled={postingAgentDrop || !dropDraft.title.trim()} className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {postingAgentDrop ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Plaats als weekdrop
                </button>
              </div>
            </form>
            <p className="text-xs text-text-muted mt-2">De klant krijgt een melding en ziet dit als "Deze week gebouwd".</p>
          </section>
        </div>
      )}

      {/* ─── REVIEWS ─── */}
      {tab === "reviews" && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text">Review rondes</h2>
            <button onClick={() => setShowReviewModal(true)} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"><Plus size={14} /> Nieuwe ronde</button>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen review rondes.</p>
          ) : (
            <TableShell head={<><Th>Titel</Th><Th>Week</Th><Th>Status</Th><Th>Feedback</Th><Th className="w-8"></Th></>}>
              {reviews.map((round) => {
                const roundFeedback = feedback[round.id] ?? [];
                const isExpanded = expandedReview === round.id;
                return (
                  <Fragment key={round.id}>
                    <tr onClick={() => setExpandedReview(isExpanded ? null : round.id)} className="hover:bg-bg cursor-pointer align-middle">
                      <Td className="font-medium text-text">{round.title}</Td>
                      <Td className="text-text-secondary">{round.week_number}</Td>
                      <Td><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[round.status] ?? ""}`}>{statusLabels[round.status] ?? round.status}</span></Td>
                      <Td className="text-text-secondary">{roundFeedback.length}</Td>
                      <Td><Caret size={15} className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} /></Td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-bg px-4 py-3">
                          {round.deployment_url && <a href={round.deployment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue hover:underline no-underline mb-3 block truncate">{round.deployment_url}</a>}
                          {roundFeedback.length === 0 ? (
                            <p className="text-xs text-text-muted">Geen feedback.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {roundFeedback.map((fb) => (
                                <div key={fb.id} className="flex items-start gap-3 p-2 rounded-[6px] bg-bg-white border border-border-light">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      {fb.category && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-text-muted">{fb.category}</span>}
                                      {fb.rating && <span className="flex items-center gap-0.5">{Array.from({ length: fb.rating }).map((_, i) => <Star key={i} size={10} className="text-[#f59e0b] fill-[#f59e0b]" />)}</span>}
                                    </div>
                                    <p className="text-sm text-text">{fb.body}</p>
                                    <p className="text-xs text-text-muted mt-0.5">{new Date(fb.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                    {fb.admin_response ? (
                                      <div className="mt-2 flex items-start gap-2 p-2 rounded-[6px] bg-blue-bg"><MessageSquare size={13} className="text-blue mt-0.5 shrink-0" /><p className="text-xs text-text">{fb.admin_response}</p></div>
                                    ) : (
                                      <div className="mt-2 flex gap-2">
                                        <input value={responseDrafts[fb.id] ?? ""} onChange={(e) => setResponseDrafts((prev) => ({ ...prev, [fb.id]: e.target.value }))} placeholder="Reageer naar de klant…" className="flex-1 text-xs rounded-[6px] border border-border-light bg-bg-white px-2 py-1.5 outline-none focus:border-text" />
                                        <button onClick={() => saveResponse(fb)} disabled={savingResponse === fb.id || !(responseDrafts[fb.id] ?? "").trim()} className="text-xs font-semibold bg-text text-white rounded-[6px] px-2.5 py-1.5 disabled:opacity-40">{savingResponse === fb.id ? "…" : "Stuur"}</button>
                                      </div>
                                    )}
                                  </div>
                                  <select value={fb.status} onChange={(e) => updateFeedbackStatus(fb.id, e.target.value)} className="text-xs rounded-[6px] border border-border-light bg-bg px-2 py-1 outline-none">
                                    <option value="open">Open</option><option value="acknowledged">Gezien</option><option value="resolved">Opgelost</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </TableShell>
          )}
        </section>
      )}

      {/* ─── KOSTEN ─── */}
      {tab === "kosten" && (
        <section>
          <h2 className="text-sm font-semibold text-text mb-1">Kosten</h2>
          <p className="text-xs text-text-muted mb-4">Wat je hier invoert, ziet de klant bij oplevering: transparant, met uitloop apart.</p>

          <form onSubmit={addCost} className="flex flex-col sm:flex-row gap-2 mb-4 p-3 rounded-[8px] bg-bg border border-border-light">
            <input value={costForm.description} onChange={(e) => setCostForm({ ...costForm, description: e.target.value })} placeholder="Omschrijving (bijv. Portaal + module 1)" className={`${inputCls} bg-bg-white flex-1`} />
            <input value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })} placeholder="Bedrag €" inputMode="decimal" className={`${inputCls} bg-bg-white w-full sm:w-32`} />
            <label className="inline-flex items-center gap-1.5 text-sm text-text-secondary px-2 shrink-0">
              <input type="checkbox" checked={costForm.is_overrun} onChange={(e) => setCostForm({ ...costForm, is_overrun: e.target.checked })} /> Uitloop
            </label>
            <button type="submit" disabled={savingCost || !costForm.description.trim()} className="bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0">
              {savingCost ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Toevoegen
            </button>
          </form>

          {costs.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen kostenregels.</p>
          ) : (
            <TableShell head={<><Th className="w-8"></Th><Th>Omschrijving</Th><Th>Type</Th><Th className="text-right">Bedrag</Th><Th className="text-right">Acties</Th></>} foot={
              <tr className="border-t border-border-light font-semibold">
                <Td colSpan={3} className="text-text">Totaal{overrunTotal > 0 ? <span className="font-normal text-text-muted"> (waarvan {formatCents(overrunTotal)} uitloop)</span> : null}</Td>
                <Td className="text-right text-text tabular-nums">{formatCents(costTotal)}</Td>
                <Td></Td>
              </tr>
            }>
              {costs.map((c, i) => (
                editingCostId === c.id ? (
                  <tr key={c.id} className="bg-bg align-middle">
                    <Td></Td>
                    <Td><input value={costEditForm.description} onChange={(e) => setCostEditForm({ ...costEditForm, description: e.target.value })} className={`${inputCls} bg-bg-white`} autoFocus /></Td>
                    <Td>
                      <label className="inline-flex items-center gap-1.5 text-xs text-text-secondary whitespace-nowrap">
                        <input type="checkbox" checked={costEditForm.is_overrun} onChange={(e) => setCostEditForm({ ...costEditForm, is_overrun: e.target.checked })} /> Uitloop
                      </label>
                    </Td>
                    <Td className="text-right"><input value={costEditForm.amount} onChange={(e) => setCostEditForm({ ...costEditForm, amount: e.target.value })} inputMode="decimal" className={`${inputCls} bg-bg-white w-24 text-right ml-auto`} /></Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={saveCostEdit} disabled={!costEditForm.description.trim()} className="text-xs font-semibold bg-text text-white rounded-[6px] px-2.5 py-1.5 disabled:opacity-40">Opslaan</button>
                      <button onClick={() => setEditingCostId(null)} className="text-xs text-text-muted hover:text-text px-2 py-1.5">Annuleer</button>
                    </Td>
                  </tr>
                ) : (
                  <tr key={c.id} className="hover:bg-bg align-middle">
                    <Td>
                      <div className="flex flex-col">
                        <button onClick={() => moveCost(i, -1)} disabled={i === 0} className="text-text-muted hover:text-text disabled:opacity-30" aria-label="Omhoog"><ChevronUp size={13} /></button>
                        <button onClick={() => moveCost(i, 1)} disabled={i === costs.length - 1} className="text-text-muted hover:text-text disabled:opacity-30" aria-label="Omlaag"><ChevronDown size={13} /></button>
                      </div>
                    </Td>
                    <Td className="text-text">{c.description}</Td>
                    <Td>{c.is_overrun ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-bg text-amber">Uitloop</span> : <span className="text-xs text-text-muted">Vast</span>}</Td>
                    <Td className="text-right text-text tabular-nums">{formatCents(c.amount_cents)}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => openEditCost(c)} className="text-text-muted hover:text-text p-1" aria-label="Bewerken"><Pencil size={14} /></button>
                      <button onClick={() => deleteCost(c)} className="text-text-muted hover:text-[#ef4444] p-1" aria-label="Verwijderen"><Trash2 size={14} /></button>
                    </Td>
                  </tr>
                )
              ))}
            </TableShell>
          )}
          {monthlyTotal > 0 && (
            <p className="text-xs text-text-muted mt-3">Daarnaast maandelijks vanaf live: <span className="font-semibold text-text">{formatMonthly(monthlyTotal)}</span> ({agentModules.filter((m) => m.monthly_price_cents != null).map((m) => m.name).join(", ")}).</p>
          )}
        </section>
      )}

      {/* Review round modal */}
      <AdminModal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Nieuwe review ronde">
        <form onSubmit={createReview} className="flex flex-col gap-4">
          <Labeled label="Titel *"><input required value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="bv. Homepage redesign" className={inputCls} /></Labeled>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label="Week nummer *"><input type="number" required min={1} value={reviewForm.week_number} onChange={(e) => setReviewForm({ ...reviewForm, week_number: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Focus gebieden"><input value={reviewForm.focus_areas} onChange={(e) => setReviewForm({ ...reviewForm, focus_areas: e.target.value })} placeholder="Navigatie, Mobiel, ..." className={inputCls} /></Labeled>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label="Startdatum"><input type="date" value={reviewForm.start_date} onChange={(e) => setReviewForm({ ...reviewForm, start_date: e.target.value })} className={inputCls} /></Labeled>
            <Labeled label="Feedback vóór"><input type="date" value={reviewForm.due_date} onChange={(e) => setReviewForm({ ...reviewForm, due_date: e.target.value })} className={inputCls} /></Labeled>
          </div>
          <Labeled label="Deployment URL *"><input required value={reviewForm.deployment_url} onChange={(e) => setReviewForm({ ...reviewForm, deployment_url: e.target.value })} placeholder="https://..." className={inputCls} /></Labeled>
          <Labeled label="Beschrijving"><textarea value={reviewForm.description} onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })} rows={2} placeholder="Waar moet de klant op letten?" className={`${inputCls} resize-none`} /></Labeled>
          <button type="submit" disabled={savingReview} className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">{savingReview ? "Opslaan..." : "Aanmaken"}</button>
        </form>
      </AdminModal>

      {/* Route-stap modal */}
      <AdminModal open={showStepModal} onClose={() => setShowStepModal(false)} title={editingStepId ? "Stap bewerken" : "Stap toevoegen"}>
        <form onSubmit={saveStep} className="flex flex-col gap-4">
          <Labeled label="Titel *"><input required value={stepForm.title} onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })} placeholder="bv. Meeloopdag inplannen" className={inputCls} /></Labeled>
          <Labeled label="Beschrijving"><textarea value={stepForm.description} onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })} rows={2} placeholder="Eén regel die de klant snapt." className={`${inputCls} resize-none`} /></Labeled>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label="Eigenaar">
              <select value={stepForm.owner} onChange={(e) => setStepForm({ ...stepForm, owner: e.target.value as "studio" | "client" })} className={inputCls}>
                <option value="studio">Studio</option>
                <option value="client">Klant</option>
              </select>
            </Labeled>
            <Labeled label="Status">
              <select value={stepForm.status} onChange={(e) => setStepForm({ ...stepForm, status: e.target.value as WorkflowStepStatus })} className={inputCls}>
                {STEP_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Labeled>
          </div>
          <Labeled label="Streefdatum"><input type="date" value={stepForm.due_date} onChange={(e) => setStepForm({ ...stepForm, due_date: e.target.value })} className={inputCls} /></Labeled>
          <button type="submit" disabled={savingStep} className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">{savingStep ? "Opslaan..." : editingStepId ? "Opslaan" : "Toevoegen"}</button>
        </form>
      </AdminModal>

      {/* Module modal */}
      <AdminModal open={showModuleModal} onClose={() => setShowModuleModal(false)} title={editingModuleId ? "Module bewerken" : "Module toevoegen"}>
        <form onSubmit={saveModule} className="flex flex-col gap-4">
          <Labeled label="Naam *"><input required value={moduleForm.name} onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })} placeholder="bv. Klokken & uren" className={inputCls} /></Labeled>
          <Labeled label="Omschrijving"><textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} placeholder="Eén regel over wat deze module doet." className={`${inputCls} resize-none`} /></Labeled>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label="Type">
              <select value={moduleForm.kind} onChange={(e) => setModuleForm({ ...moduleForm, kind: e.target.value as ModuleKind })} className={inputCls}>
                <option value="system">Systeem-module</option>
                <option value="agent">Agent</option>
              </select>
            </Labeled>
            {moduleForm.kind === "agent" && (
              <Labeled label="Maandprijs € (vanaf live)">
                <input value={moduleForm.monthly_price} onChange={(e) => setModuleForm({ ...moduleForm, monthly_price: e.target.value })} placeholder="bv. 149,00" inputMode="decimal" className={inputCls} />
              </Labeled>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label="Status">
              <select value={moduleForm.status} onChange={(e) => setModuleForm({ ...moduleForm, status: e.target.value as ModuleStatus })} className={inputCls}>
                {MODULE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Labeled>
            <Labeled label="Icoon">
              <select value={moduleForm.icon} onChange={(e) => setModuleForm({ ...moduleForm, icon: e.target.value })} className={inputCls}>
                <option value="">Standaard</option>
                {MODULE_ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Labeled>
          </div>
          <Labeled label="Preview-link"><input value={moduleForm.preview_url} onChange={(e) => setModuleForm({ ...moduleForm, preview_url: e.target.value })} placeholder="https://..." className={inputCls} /></Labeled>
          <button type="submit" disabled={savingModule} className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">{savingModule ? "Opslaan..." : editingModuleId ? "Opslaan" : "Toevoegen"}</button>
        </form>
      </AdminModal>
    </div>
  );
}

const inputCls = "w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

function TableShell({ head, foot, children }: { head: React.ReactNode; foot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-border-light overflow-hidden bg-bg-white">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-text-muted bg-bg border-b border-border-light">{head}</tr></thead>
        <tbody className="divide-y divide-border-light">{children}</tbody>
        {foot && <tfoot>{foot}</tfoot>}
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`font-medium px-4 py-2.5 ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
