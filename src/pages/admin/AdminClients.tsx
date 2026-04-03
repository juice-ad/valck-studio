import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";

interface ClientRow {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  created_at: string;
  projects: { count: number }[];
  user_client_memberships: { count: number }[];
}

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

  const columns: Column<ClientRow>[] = [
    { key: "company_name", label: "Organisatie" },
    { key: "contact_person", label: "Contactpersoon" },
    { key: "email", label: "E-mail" },
    {
      key: "projects",
      label: "Projecten",
      sortable: false,
      render: (row) => row.projects?.[0]?.count ?? 0,
    },
    {
      key: "user_client_memberships",
      label: "Users",
      sortable: false,
      render: (row) => row.user_client_memberships?.[0]?.count ?? 0,
    },
    {
      key: "created_at",
      label: "Aangemaakt",
      render: (row) => new Date(row.created_at).toLocaleDateString("nl-NL"),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Organisaties</h1>

      <AdminTable
        columns={columns}
        data={clients}
        loading={loading}
        searchPlaceholder="Zoek organisatie..."
        searchFields={["company_name", "contact_person", "email"]}
        onRowClick={(row) => navigate(`/admin/clients/${row.id}`)}
        emptyMessage="Geen organisaties gevonden."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors"
          >
            <Plus size={16} />
            Nieuwe organisatie
          </button>
        }
      />

      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Nieuwe organisatie">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Bedrijfsnaam *</label>
            <input
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Contactpersoon *</label>
            <input
              required
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">E-mail *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Telefoon</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
