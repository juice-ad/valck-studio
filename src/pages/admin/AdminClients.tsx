import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import { clientColumns, type ClientRow } from "@/components/admin/columns/clients-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company_name: "", contact_person: "", email: "", phone: "" });

  async function loadClients() {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*, projects(count), user_client_memberships(count)")
      .order("created_at", { ascending: false });
    setClients((data as ClientRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadClients(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim() || !form.email.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("clients").insert({
      company_name: form.company_name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
    });

    if (!error) {
      setShowCreate(false);
      setForm({ company_name: "", contact_person: "", email: "", phone: "" });
      loadClients();
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Organisaties</h1>

      <DataTable
        columns={clientColumns}
        data={clients}
        loading={loading}
        searchPlaceholder="Zoek organisatie..."
        searchColumn="company_name"
        onRowClick={(row) => navigate(`/admin/clients/${row.id}`)}
        emptyMessage="Geen organisaties gevonden."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nieuwe organisatie
          </Button>
        }
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe organisatie</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Bedrijfsnaam *</label>
              <Input
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Contactpersoon *</label>
              <Input
                required
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">E-mail *</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Telefoon</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
