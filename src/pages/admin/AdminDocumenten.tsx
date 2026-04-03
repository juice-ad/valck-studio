import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import { documentColumns, type DocRow } from "@/components/admin/columns/documenten-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Documenten</h1>

      <DataTable
        columns={documentColumns}
        data={docs}
        loading={loading}
        searchPlaceholder="Zoek document..."
        searchColumn="name"
        emptyMessage="Geen documenten gevonden."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Upload document
          </Button>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Naam *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Organisatie *</label>
              <Select
                value={form.client_id}
                onValueChange={(val) => setForm({ ...form, client_id: val, project_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies organisatie..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Project</label>
              <Select
                value={form.project_id}
                onValueChange={(val) => setForm({ ...form, project_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Geen project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Bestand URL *</label>
              <Input
                required
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Opslaan..." : "Toevoegen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
