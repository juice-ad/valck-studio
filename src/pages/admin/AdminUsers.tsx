import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_admin: boolean;
  linked_client_id: string | null;
  created_at: string;
  clients: { company_name: string } | null;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, clients:linked_client_id(company_name)")
      .order("created_at", { ascending: false });
    setUsers((data as UserRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleSaveRole() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("profiles").update({
      role: editRole,
      is_admin: editRole === "admin",
    }).eq("id", selected.id);
    setSelected(null);
    loadUsers();
    setSaving(false);
  }

  const columns: Column<UserRow>[] = [
    { key: "full_name", label: "Naam", render: (row) => row.full_name || "—" },
    { key: "email", label: "E-mail" },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          row.role === "admin" ? "bg-accent-soft text-text" : "bg-blue-bg text-blue"
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      key: "linked_client_id",
      label: "Organisatie",
      render: (row) => row.clients?.company_name ?? "—",
    },
    {
      key: "created_at",
      label: "Aangemaakt",
      render: (row) => new Date(row.created_at).toLocaleDateString("nl-NL"),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Gebruikers</h1>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Zoek gebruiker..."
        searchFields={["full_name", "email"]}
        onRowClick={(row) => { setSelected(row); setEditRole(row.role); }}
        emptyMessage="Geen gebruikers gevonden."
      />

      <AdminModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || "Gebruiker"}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-text-muted">E-mail</p>
              <p className="text-sm text-text">{selected.email}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Organisatie</p>
              <p className="text-sm text-text">{selected.clients?.company_name ?? "Geen"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors"
              >
                <option value="client">client</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button
              onClick={handleSaveRole}
              disabled={saving || editRole === selected.role}
              className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
