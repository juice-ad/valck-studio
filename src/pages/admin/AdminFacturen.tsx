import { useEffect, useState, type FormEvent } from "react";
import { Plus, Send, ExternalLink, Copy, Check, Trash2, FileDown } from "lucide-react";
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

interface LineItemForm {
  description: string;
  quantity: string;
  priceCents: string; // EUR input as string
}

const emptyLineItem: LineItemForm = { description: "", quantity: "1", priceCents: "" };

export function AdminFacturen() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [reference, setReference] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([{ ...emptyLineItem }]);

  // Status edit
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | null>(null);
  const [editStatus, setEditStatus] = useState<InvoiceStatus>("concept");
  const [savingStatus, setSavingStatus] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  // --- Line item helpers ---

  function updateLineItem(index: number, field: keyof LineItemForm, value: string) {
    setLineItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }

  function lineItemCents(item: LineItemForm): number {
    const price = parseFloat(item.priceCents);
    const qty = parseFloat(item.quantity);
    if (isNaN(price) || isNaN(qty)) return 0;
    return Math.round(price * 100) * qty;
  }

  const totalExclBtw = lineItems.reduce((sum, item) => sum + lineItemCents(item), 0);
  const btwAmount = Math.round(totalExclBtw * 0.21);
  const totalInclBtw = totalExclBtw + btwAmount;

  function resetCreateForm() {
    setClientId("");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);
    setReference("");
    setSendEmail(true);
    setLineItems([{ ...emptyLineItem }]);
  }

  // --- Handlers ---

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!clientId) return;

    const validItems = lineItems.filter(
      (item) => item.description.trim() && parseFloat(item.priceCents) > 0 && parseFloat(item.quantity) > 0
    );
    if (validItems.length === 0) {
      toast.error("Voeg minstens één regelitem toe");
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-full-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId,
            items: validItems.map((item) => ({
              description: item.description.trim(),
              quantity: parseFloat(item.quantity),
              priceCents: Math.round(parseFloat(item.priceCents) * 100),
            })),
            dueDate: dueDate || undefined,
            reference: reference.trim() || undefined,
            sendEmail,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fout bij aanmaken factuur");
      }

      toast.success(`Factuur ${data.number} aangemaakt${sendEmail ? " en verstuurd" : ""}`);
      setShowCreate(false);
      resetCreateForm();
      loadInvoices();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
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

  async function handleDownloadPdf() {
    if (!editInvoice) return;
    setDownloadingPdf(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-invoice-pdf?invoiceId=${editInvoice.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Fout bij downloaden PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factuur-${editInvoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDownloadingPdf(false);
    }
  }

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

      {/* Create dialog with line items */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetCreateForm(); } else { setShowCreate(true); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe factuur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Organisatie *</label>
                <Select value={clientId} onValueChange={setClientId}>
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
                <label className="block text-sm font-medium text-text mb-1.5">Vervaldatum</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Referentie</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optionele referentie..."
              />
            </div>

            {/* Line items */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Regelitems *</label>
              <div className="flex flex-col gap-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_80px_120px_32px] gap-2 items-start">
                    <Input
                      placeholder="Omschrijving"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Aantal"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Prijs (EUR)"
                      value={item.priceCents}
                      onChange={(e) => updateLineItem(index, "priceCents", e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="h-9 w-8 p-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="mt-2"
              >
                <Plus size={14} /> Regelitem toevoegen
              </Button>
            </div>

            {/* Totals */}
            <div className="rounded-[8px] bg-accent-soft p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotaal excl. BTW</span>
                <span className="text-text">{formatCents(totalExclBtw)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-text-muted">BTW (21%)</span>
                <span className="text-text">{formatCents(btwAmount)}</span>
              </div>
              <div className="flex justify-between mt-1 font-semibold border-t border-border pt-1">
                <span className="text-text">Totaal incl. BTW</span>
                <span className="text-text">{formatCents(totalInclBtw)}</span>
              </div>
            </div>

            {/* Send email checkbox */}
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-border"
              />
              Verstuur per email via Moneybird
            </label>

            <Button type="submit" disabled={saving || !clientId}>
              {saving ? "Aanmaken..." : "Factuur aanmaken"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice detail / status edit dialog */}
      <Dialog open={!!editInvoice} onOpenChange={(open) => { if (!open) setEditInvoice(null); }}>
        <DialogContent className="max-w-lg">
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

              {/* Line items detail */}
              {editInvoice.line_items && editInvoice.line_items.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1.5">Regelitems</p>
                  <div className="rounded-[8px] bg-accent-soft p-3 text-sm">
                    {editInvoice.line_items.map((item, i) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span className="text-text">
                          {item.quantity}x {item.description}
                        </span>
                        <span className="text-text-secondary whitespace-nowrap">
                          {formatCents(item.price_cents * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF download */}
              {editInvoice.moneybird_invoice_id && (
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  <FileDown size={14} />
                  {downloadingPdf ? "Downloaden..." : "Download PDF"}
                </Button>
              )}

              {/* Payment link section */}
              {editInvoice.mollie_payment_link_url ? (
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
                        href={editInvoice.mollie_payment_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                    </Button>
                  </div>
                  {editInvoice.paid_at && (
                    <p className="text-xs text-green mt-2">
                      Betaald op {new Date(editInvoice.paid_at).toLocaleDateString("nl-NL")}
                      {editInvoice.payment_method && ` via ${editInvoice.payment_method}`}
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
