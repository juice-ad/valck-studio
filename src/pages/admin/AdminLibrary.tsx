import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import { libraryColumns, type LibraryRow } from "@/components/admin/columns/library-columns";
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

interface LibraryForm {
  slug: string;
  name: string;
  description: string;
  category: "component" | "module" | "agent";
  price_eur: string; // invoer in euro's, opgeslagen in centen
  price_note: string;
  built_for: string; // komma-gescheiden invoer
  stack: string;
  source_ref: string;
  tags: string;
  is_active: boolean;
  sort_order: string;
}

const EMPTY_FORM: LibraryForm = {
  slug: "",
  name: "",
  description: "",
  category: "module",
  price_eur: "",
  price_note: "±",
  built_for: "",
  stack: "",
  source_ref: "",
  tags: "",
  is_active: true,
  sort_order: "0",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toForm(row: LibraryRow): LibraryForm {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    price_eur:
      row.price_cents_indicative != null
        ? String(row.price_cents_indicative / 100)
        : "",
    price_note: row.price_note ?? "",
    built_for: row.built_for.join(", "),
    stack: row.stack ?? "",
    source_ref: row.source_ref ?? "",
    tags: row.tags.join(", "),
    is_active: row.is_active,
    sort_order: String(row.sort_order),
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function AdminLibrary() {
  const [items, setItems] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LibraryForm>(EMPTY_FORM);

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase
      .from("library_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as LibraryRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function openEdit(row: LibraryRow) {
    setEditingId(row.id);
    setForm(toForm(row));
    setShowDialog(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const priceEur = form.price_eur.trim().replace(",", ".");
    const payload = {
      slug: form.slug.trim() || slugify(form.name),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price_cents_indicative: priceEur ? Math.round(parseFloat(priceEur) * 100) : null,
      price_note: form.price_note.trim() || null,
      built_for: splitList(form.built_for),
      stack: form.stack.trim() || null,
      source_ref: form.source_ref.trim() || null,
      tags: splitList(form.tags),
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase.from("library_items").update(payload).eq("id", editingId)
      : await supabase.from("library_items").insert(payload);

    if (!error) {
      setShowDialog(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      loadItems();
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-1">Bibliotheek</h1>
      <p className="text-sm text-text-secondary mb-6">
        Eerder gebouwde componenten, modules en agents. Deze items verschijnen met
        indicatieprijs in de intake en bij build requests.
      </p>

      <DataTable
        columns={libraryColumns}
        data={items}
        loading={loading}
        searchPlaceholder="Zoek in bibliotheek..."
        searchColumn="name"
        onRowClick={openEdit}
        emptyMessage="Nog geen items. Voeg de eerste oogst toe."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Nieuw item
          </Button>
        }
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Item bewerken" : "Nieuw item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Naam *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Slug (leeg = automatisch)
              </label>
              <Input
                value={form.slug}
                placeholder={slugify(form.name) || "bijv. klok-flow"}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Omschrijving</label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Categorie</label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value as LibraryForm["category"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="module">Module</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="component">Component</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Indicatieprijs (EUR, excl. btw)
                </label>
                <div className="flex gap-2">
                  <Input
                    className="w-16"
                    value={form.price_note}
                    placeholder="±"
                    onChange={(e) => setForm({ ...form, price_note: e.target.value })}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form.price_eur}
                    placeholder="1750"
                    onChange={(e) => setForm({ ...form, price_eur: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Gebruikt bij (komma-gescheiden)
                </label>
                <Input
                  value={form.built_for}
                  placeholder="juice-events, ccp"
                  onChange={(e) => setForm({ ...form, built_for: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Stack</label>
                <Input
                  value={form.stack}
                  placeholder="react18-tw3"
                  onChange={(e) => setForm({ ...form, stack: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Bron (registry-pad)
              </label>
              <Input
                value={form.source_ref}
                placeholder="valck-registry/items/klok-flow"
                onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Tags (komma-gescheiden)
                </label>
                <Input
                  value={form.tags}
                  placeholder="uren, klokken, mobiel"
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Sortering</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              Actief (zichtbaar in intake)
            </label>
            <Button type="submit" disabled={saving}>
              {saving ? "Opslaan..." : editingId ? "Opslaan" : "Aanmaken"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
