import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import type { InvoiceStatus } from "@/types/portal";

interface InvoiceRow {
  id: string;
  number: string;
  description: string | null;
  amount_cents: number;
  status: InvoiceStatus;
  due_date: string | null;
  client_id: string;
  created_at: string;
  clients: { company_name: string } | null;
}

interface ClientOption { id: string; company_name: string; }

const statusLabels: Record<InvoiceStatus, string> = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  betaald: "Betaald",
  vervallen: "Vervallen",
};

const statusStyles: Record<InvoiceStatus, string> = {
  concept: "bg-accent-soft text-text-muted",
  verstuurd: "bg-blue-bg text-blue",
  betaald: "bg-green-bg text-green",
  vervallen: "bg-red-50 text-red-600",
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export function AdminFacturen() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ number: "", description: "", amount: "", client_id: "", due_date: "" });

  // Status edit
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | null>(null);
  const [editStatus, setEditStatus] = useState<InvoiceStatus>("concept");
  const [savingStatus, setSavingStatus] = useState(false);

  async function loadInvoices() {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("*, clients(company_name)")
      .order("created_at", { ascending: false });
    setInvoices((data as InvoiceRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadInvoices();
    supabase.from("clients").select("id, company_name").order("company_name").then(({ data }) => setClients((data as ClientOption[]) ?? []));
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.number.trim() || !form.client_id || !form.amount) return;
    setSaving(true);

    await supabase.from("invoices").insert({
      number: form.number.trim(),
      description: form.description.trim() || null,
      amount_cents: Math.round(parseFloat(form.amount) * 100),
      client_id: form.client_id,
      due_date: form.due_date || null,
      status: "concept",
    });

    setShowCreate(false);
    setForm({ number: "", description: "", amount: "", client_id: "", due_date: "" });
    setSaving(false);
    loadInvoices();
  }

  async function handleStatusSave() {
    if (!editInvoice) return;
    setSavingStatus(true);
    await supabase.from("invoices").update({ status: editStatus }).eq("id", editInvoice.id);
    setEditInvoice(null);
    setSavingStatus(false);
    loadInvoices();
  }

  const columns: Column<InvoiceRow>[] = [
    { key: "number", label: "Nummer", className: "font-medium whitespace-nowrap" },
    { key: "clients", label: "Organisatie", render: (row) => row.clients?.company_name ?? "—" },
    { key: "description", label: "Omschrijving", render: (row) => row.description ?? "—" },
    {
      key: "amount_cents",
      label: "Bedrag",
      render: (row) => <span className="font-medium whitespace-nowrap">{formatCents(row.amount_cents)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[row.status]}`}>
          {statusLabels[row.status]}
        </span>
      ),
    },
    {
      key: "due_date",
      label: "Vervaldatum",
      render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString("nl-NL") : "—",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Facturen</h1>

      <AdminTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Zoek factuur..."
        searchFields={["number", "description"]}
        onRowClick={(row) => { setEditInvoice(row); setEditStatus(row.status); }}
        emptyMessage="Geen facturen gevonden."
        actions={
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2 text-sm font-semibold hover:bg-[#333] transition-colors">
            <Plus size={16} /> Nieuwe factuur
          </button>
        }
      />

      {/* Create modal */}
      <AdminModal open={showCreate} onClose={() => setShowCreate(false)} title="Nieuwe factuur">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Nummer *</label>
              <input required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="VS-2026-001"
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Bedrag (EUR) *</label>
              <input required type="number" step="0.01" min="0" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1500.00"
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Organisatie *</label>
            <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors">
              <option value="">Kies organisatie...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Omschrijving</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Vervaldatum</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">
            {saving ? "Opslaan..." : "Aanmaken"}
          </button>
        </form>
      </AdminModal>

      {/* Status edit modal */}
      <AdminModal open={!!editInvoice} onClose={() => setEditInvoice(null)} title={`Factuur ${editInvoice?.number ?? ""}`}>
        {editInvoice && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-muted">Organisatie</p>
                <p className="text-sm text-text">{editInvoice.clients?.company_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Bedrag</p>
                <p className="text-sm font-medium text-text">{formatCents(editInvoice.amount_cents)}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as InvoiceStatus)}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-text transition-colors">
                <option value="concept">Concept</option>
                <option value="verstuurd">Verstuurd</option>
                <option value="betaald">Betaald</option>
                <option value="vervallen">Vervallen</option>
              </select>
            </div>
            <button onClick={handleStatusSave} disabled={savingStatus || editStatus === editInvoice.status}
              className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50">
              {savingStatus ? "Opslaan..." : "Status bijwerken"}
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
