import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Client, Project, Invoice } from "@/types/portal";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite state
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: "", contact_person: "", email: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const [clientRes, usersRes, projectsRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).single(),
        supabase
          .from("user_client_memberships")
          .select("user_id, profiles:user_id(id, full_name, email, role)")
          .eq("client_id", id),
        supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(10),
      ]);

      const c = clientRes.data as Client | null;
      setClient(c);
      if (c) {
        setEditForm({
          company_name: c.company_name,
          contact_person: c.contact_person,
          email: c.email,
          phone: c.phone ?? "",
          notes: c.notes ?? "",
        });
      }

      const parsed = (usersRes.data ?? [])
        .map((row: Record<string, unknown>) => row.profiles as ProfileRow)
        .filter(Boolean);
      setUsers(parsed);
      setProjects((projectsRes.data as Project[]) ?? []);
      setInvoices((invoicesRes.data as Invoice[]) ?? []);
      setLoading(false);
    }

    load();
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    await supabase.from("clients").update({
      company_name: editForm.company_name.trim(),
      contact_person: editForm.contact_person.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
      notes: editForm.notes.trim() || null,
    }).eq("id", id);
    setClient((prev) => prev ? { ...prev, ...editForm } : prev);
    setEditing(false);
    setSaving(false);
  }

  async function createInvite() {
    if (!id) return;
    setCreatingInvite(true);
    const token = crypto.randomUUID().slice(0, 8);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("invites").insert({
      token,
      client_id: id,
      expires_at: expiresAt,
    });

    if (!error) {
      const url = `${window.location.origin}/portal/signup/${token}`;
      setInviteUrl(url);
    }
    setCreatingInvite(false);
  }

  function copyInvite() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Organisatie niet gevonden.</p>
        <Link to="/admin/clients" className="text-sm text-text mt-2 inline-block no-underline hover:underline">
          Terug
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Terug
      </Link>

      <h1 className="text-2xl font-bold text-text mb-6">{client.company_name}</h1>

      {/* Client info */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">Organisatie-info</h2>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            {saving ? "Opslaan..." : editing ? "Opslaan" : "Bewerken"}
          </button>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Bedrijfsnaam", key: "company_name" as const },
              { label: "Contactpersoon", key: "contact_person" as const },
              { label: "E-mail", key: "email" as const },
              { label: "Telefoon", key: "phone" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-text-muted mb-1">{label}</label>
                <input
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">Notities</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2 text-sm text-text outline-none focus:border-text transition-colors resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoField label="Contactpersoon" value={client.contact_person} />
            <InfoField label="E-mail" value={client.email} />
            <InfoField label="Telefoon" value={client.phone} />
            <InfoField label="Website" value={client.website_url} />
            {client.notes && (
              <div className="sm:col-span-2">
                <InfoField label="Notities" value={client.notes} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">Gebruikers ({users.length})</h2>
          <button
            onClick={createInvite}
            disabled={creatingInvite}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <UserPlus size={14} />
            Uitnodigen
          </button>
        </div>

        {inviteUrl && (
          <div className="mb-4 p-3 rounded-[8px] bg-blue-bg border border-[#bfdbfe]">
            <p className="text-xs text-text-secondary mb-1">Uitnodigingslink (geldig 7 dagen):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-bg-white rounded px-2 py-1 text-text truncate">{inviteUrl}</code>
              <button onClick={copyInvite} className="p-1.5 rounded-[6px] hover:bg-bg-white transition-colors">
                {copied ? <Check size={14} className="text-green" /> : <Copy size={14} className="text-text-muted" />}
              </button>
            </div>
          </div>
        )}

        {users.length === 0 ? (
          <p className="text-sm text-text-muted">Geen gebruikers gekoppeld.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-[8px] border border-border-light">
                <div>
                  <p className="text-sm font-medium text-text">{u.full_name || "-"}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-soft text-text-muted">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-4">Projecten ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-text-muted">Geen projecten.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/admin/projecten/${p.id}`}
                className="flex items-center justify-between p-3 rounded-[8px] border border-border-light no-underline hover:bg-accent-soft/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text">{p.title}</p>
                  {p.start_date && (
                    <p className="text-xs text-text-muted">
                      Gestart: {new Date(p.start_date).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  p.phase === "build" ? "bg-green-bg text-green" :
                  p.phase === "discovery" ? "bg-blue-bg text-blue" :
                  p.phase === "completed" ? "bg-green-bg text-green" :
                  "bg-accent-soft text-text"
                }`}>
                  {p.phase === "completed" ? "Afgerond" : p.phase.charAt(0).toUpperCase() + p.phase.slice(1)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-sm font-semibold text-text mb-4">Facturen ({invoices.length})</h2>
          <div className="flex flex-col gap-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-[8px] border border-border-light">
                <div>
                  <p className="text-sm font-medium text-text">{inv.number}</p>
                  <p className="text-xs text-text-muted">{inv.description || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text">
                    {(inv.amount_cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" })}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    inv.status === "betaald" ? "bg-green-bg text-green" :
                    inv.status === "verstuurd" ? "bg-blue-bg text-blue" :
                    inv.status === "vervallen" ? "bg-red-50 text-red-600" :
                    "bg-accent-soft text-text-muted"
                  }`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text">{value || "-"}</p>
    </div>
  );
}
