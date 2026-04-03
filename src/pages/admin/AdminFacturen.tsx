import { useEffect, useState, type FormEvent } from "react";
import { Plus, Send, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import {
  invoiceColumns,
  statusLabels,
  formatCents,
  type InvoiceRow,
} from "@/components/admin/columns/facturen-columns";
import type { InvoiceStatus } from "@/types/portal";
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
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

    const { error } = await supabase.from("invoices").insert({
      number: form.number.trim(),
      description: form.description.trim() || null,
      amount_cents: Math.round(parseFloat(form.amount) * 100),
      client_id: form.client_id,
      due_date: form.due_date || null,
      status: "concept",
    });

    if (error) {
      toast.error("Fout bij aanmaken factuur");
    } else {
      toast.success("Factuur aangemaakt");
      setShowCreate(false);
      setForm({ number: "", description: "", amount: "", client_id: "", due_date: "" });
      loadInvoices();
    }
    setSaving(false);
  }

  async function handleStatusSave() {
    if (!editInvoice) return;
    setSavingStatus(true);
    const { error } = await supabase.from("invoices").update({ status: editStatus }).eq("id", editInvoice.id);
    if (error) {
      toast.error("Fout bij bijwerken status");
    } else {
      toast.success("Status bijgewerkt");
      setEditInvoice(null);
      loadInvoices();
    }
    setSavingStatus(false);
  }

  async function handleCreatePaymentLink() {
    if (!editInvoice) return;
    setSendingPaymentLink(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoiceId: editInvoice.id }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fout bij aanmaken betaallink");
      }

      toast.success("Betaallink aangemaakt");
      setEditInvoice(null);
      loadInvoices();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSendingPaymentLink(false);
    }
  }

  async function handleCopyPaymentLink() {
    if (!editInvoice?.mollie_payment_link_url) return;
    try {
      await navigator.clipboard.writeText(editInvoice.mollie_payment_link_url);
      setCopiedLink(true);
      toast.success("Link gekopieerd");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  }

  // Extended invoice row with payment fields
  const editInvoiceExtended = editInvoice as InvoiceRow & {
    mollie_payment_link_url?: string | null;
    paid_at?: string | null;
    payment_method?: string | null;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Facturen</h1>

      <DataTable
        columns={invoiceColumns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Zoek factuur..."
        searchColumn="number"
        onRowClick={(row) => { setEditInvoice(row); setEditStatus(row.status); setCopiedLink(false); }}
        emptyMessage="Geen facturen gevonden."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nieuwe factuur
          </Button>
        }
      />

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe factuur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Nummer *</label>
                <Input
                  required
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="VS-2026-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Bedrag (EUR) *</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="1500.00"
                />
              </div>
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
              <label className="block text-sm font-medium text-text mb-1.5">Omschrijving</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Vervaldatum</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Opslaan..." : "Aanmaken"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice detail / status edit dialog */}
      <Dialog open={!!editInvoice} onOpenChange={(open) => { if (!open) setEditInvoice(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Factuur {editInvoice?.number ?? ""}</DialogTitle>
          </DialogHeader>
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

              {/* Payment link section */}
              {editInvoiceExtended.mollie_payment_link_url ? (
                <div className="rounded-[8px] bg-green-bg border border-green-border p-3">
                  <p className="text-xs font-medium text-green mb-2">Betaallink actief</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPaymentLink}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLink ? "Gekopieerd" : "Kopieer link"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={editInvoiceExtended.mollie_payment_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    </Button>
                  </div>
                  {editInvoiceExtended.paid_at && (
                    <p className="text-xs text-green mt-2">
                      Betaald op {new Date(editInvoiceExtended.paid_at).toLocaleDateString("nl-NL")}
                      {editInvoiceExtended.payment_method && ` via ${editInvoiceExtended.payment_method}`}
                    </p>
                  )}
                </div>
              ) : editInvoice.status !== "betaald" ? (
                <Button
                  variant="outline"
                  onClick={handleCreatePaymentLink}
                  disabled={sendingPaymentLink}
                >
                  <Send size={14} />
                  {sendingPaymentLink ? "Aanmaken..." : "Betaallink aanmaken"}
                </Button>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Status</label>
                <Select value={editStatus} onValueChange={(val) => setEditStatus(val as InvoiceStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(statusLabels) as [InvoiceStatus, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleStatusSave}
                disabled={savingStatus || editStatus === editInvoice.status}
              >
                {savingStatus ? "Opslaan..." : "Status bijwerken"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
