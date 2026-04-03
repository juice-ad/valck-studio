import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import { userColumns, type UserRow } from "@/components/admin/columns/users-columns";
import { Button } from "@/components/ui/button";
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Gebruikers</h1>

      <DataTable
        columns={userColumns}
        data={users}
        loading={loading}
        searchPlaceholder="Zoek gebruiker..."
        searchColumn="full_name"
        onRowClick={(row) => { setSelected(row); setEditRole(row.role); }}
        emptyMessage="Geen gebruikers gevonden."
      />

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.full_name || "Gebruiker"}</DialogTitle>
          </DialogHeader>
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
                <label className="block text-sm font-medium text-text mb-1.5">Rol</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">client</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveRole}
                disabled={saving || editRole === selected.role}
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
