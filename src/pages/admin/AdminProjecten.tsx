import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import type { ProjectPhase } from "@/types/portal";

interface ProjectRow {
  id: string;
  title: string;
  phase: ProjectPhase;
  start_date: string | null;
  client_id: string;
  created_at: string;
  clients: { company_name: string } | null;
  review_rounds: { count: number }[];
}

interface ClientOption {
  id: string;
  company_name: string;
}

const phaseLabels: Record<ProjectPhase, string> = {
  discovery: "Discovery",
  build: "Build",
  scale: "Scale",
  completed: "Afgerond",
};

const phaseStyles: Record<ProjectPhase, string> = {
  discovery: "bg-blue-bg text-blue",
  build: "bg-green-bg text-green",
  scale: "bg-accent-soft text-text",
  completed: "bg-green-bg text-green",
};

export function AdminProjecten() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", client_id: "", phase: "discovery" as ProjectPhase,
    vercel_project_id: "", live_url: "",
  });

  async function loadProjects() {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*, clients(company_name), review_rounds(count)")
      .order("created_at", { ascending: false });
    setProjects((data as ProjectRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
    supabase.from("clients").select("id, company_name").order("company_name").then(({ data }) => {
      setClients((data as ClientOption[]) ?? []);
    });
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.client_id) return;
    setSaving(true);

    const { error } = await supabase.from("projects").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      client_id: form.client_id,
      phase: form.phase,
      vercel_project_id: form.vercel_project_id.trim() || null,
      live_url: form.live_url.trim() || null,
    });

    if (!error) {
      setShowCreate(false);
      setForm({ title: "", description: "", client_id: "", phase: "discovery", vercel_project_id: "", live_url: "" });
      loadProjects();
    }
    setSaving(false);
  }

  const columns: Column<ProjectRow>[] = [
    { key: "title", label: "Project" },
    {
      key: "client_id",
      label: "Organisatie",
      render: (row) => row.clients?.company_name ?? "—",
    },
    {
      key: "phase",
      label: "Fase",
      render: (row) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${phaseStyles[row.phase]}`}>
          {phaseLabels[row.phase]}
        </span>
      ),
    },
    {
      key: "review_rounds",
      label: "Reviews",
      sortable: false,
      render: (row) => row.review_rounds?.[0]?.count ?? 0,
    },
    {
      key: "start_date",
      label: "Startdatum",
      render: (row) => row.start_date ? new Date(row.start_date).toLocaleDateString("nl-NL") : "—",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Projecten</h1>

      <AdminTable
        columns={columns}
        data={projects}
        loading={loading}
        searchPlaceholder="Zoek project..."
        searchFields={["title"]}
        onRowClick={(row) => navigate(`/admin/projecten/${row.id}`)}
        emptyMessage="Geen projecten gevonden."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors"
          >
            <Plus size={16} />
            Nieuw project
          </button>
        }
      />

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Nieuw project">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Organisatie *</label>
            <select
              required
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
            >
              <option value="">Kies organisatie...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Beschrijving</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Fase</label>
              <select
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value as ProjectPhase })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
              >
                <option value="discovery">Discovery</option>
                <option value="build">Build</option>
                <option value="scale">Scale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Vercel Project ID</label>
              <input
                value={form.vercel_project_id}
                onChange={(e) => setForm({ ...form, vercel_project_id: e.target.value })}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Live URL</label>
            <input
              value={form.live_url}
              onChange={(e) => setForm({ ...form, live_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Aanmaken"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
