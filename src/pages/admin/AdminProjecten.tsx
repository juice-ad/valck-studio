import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import { projectColumns, type ProjectRow } from "@/components/admin/columns/projecten-columns";
import type { ProjectPhase } from "@/types/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface ClientOption {
  id: string;
  company_name: string;
}

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Projecten</h1>

      <DataTable
        columns={projectColumns}
        data={projects}
        loading={loading}
        searchPlaceholder="Zoek project..."
        searchColumn="title"
        onRowClick={(row) => navigate(`/admin/projecten/${row.id}`)}
        emptyMessage="Geen projecten gevonden."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nieuw project
          </Button>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Organisatie *</label>
              <Select
                value={form.client_id}
                onValueChange={(val) => setForm({ ...form, client_id: val })}
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
              <label className="block text-sm font-medium text-text mb-1.5">Beschrijving</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Fase</label>
                <Select
                  value={form.phase}
                  onValueChange={(val) => setForm({ ...form, phase: val as ProjectPhase })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="build">Build</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Vercel Project ID</label>
                <Input
                  value={form.vercel_project_id}
                  onChange={(e) => setForm({ ...form, vercel_project_id: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Live URL</label>
              <Input
                value={form.live_url}
                onChange={(e) => setForm({ ...form, live_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Opslaan..." : "Aanmaken"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
