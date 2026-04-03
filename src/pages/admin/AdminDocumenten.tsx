import { useEffect, useState, type FormEvent } from "react";
import { Plus, Download, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";

interface DocRow {
  id: string;
  name: string;
  file_url: string;
  client_id: string;
  project_id: string | null;
  created_at: string;
  clients: { company_name: string } | null;
  projects: { title: string } | null;
}

interface ClientOption { id: string; company_name: string; }
interface ProjectOption { id: string; title: string; client_id: string; }

export function AdminDocumenten() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", file_url: "", client_id: "", project_id: "" });

  async function loadDocs() {
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("*, clients(company_name), projects(title)")
      .order("created_at", { ascending: false });
    setDocs((data as DocRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDocs();
    supabase.from("clients").select("id, company_name").order("company_name").then(({ data }) => setClients((data as ClientOption[]) ?? []));
    supabase.from("projects").select("id, title, client_id").order("title").then(({ data }) => setProjects((data as ProjectOption[]) ?? []));
  }, []);

  const filteredProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id)
    : projects;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.file_url.trim() || !form.client_id) return;
    setSaving(true);

    await supabase.from("documents").insert({
      name: form.name.trim(),
      file_url: form.file_url.trim(),
      client_id: form.client_id,
      project_id: form.project_id || null,
    });

    setShowCreate(false);
    setForm({ name: "", file_url: "", client_id: "", project_id: "" });
    setSaving(false);
    loadDocs();
  }

  const columns: Column<DocRow>[] = [
    {
      key: "name",
      label: "Naam",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <FileText size={14} className="text-text-muted" />
          {row.name}
        </span>
      ),
    },
    { key: "clients", label: "Organisatie", render: (row) => row.clients?.company_name ?? "—" },
    { key: "projects", label: "Project", render: (row) => row.projects?.title ?? "—" },
    {
      key: "created_at",
      label: "Geüpload",
      render: (row) => new Date(row.created_at).toLocaleDateString("nl-NL"),
    },
    {
      key: "file_url",
      label: "",
      sortable: false,
      render: (row) => (
        <a href={row.file_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text no-underline">
          <Download size={14} /> Download
        </a>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Documenten</h1>
      <AdminTable
        columns={columns}
        data={docs}
        loading={loading}
        searchPlaceholder="Zoek document..."
        searchFields={["name"]}
        emptyMessage="Geen documenten gevonden."
        actions={
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors">
            <Plus size={16} /> Upload document
          </button>
        }
      />

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Nieuw document">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Naam *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Organisatie *</label>
            <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, project_id: "" })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors">
              <option value="">Kies organisatie...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Project</label>
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors">
              <option value="">Geen project</option>
              {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Bestand URL *</label>
            <input required value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">
            {saving ? "Opslaan..." : "Toevoegen"}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
