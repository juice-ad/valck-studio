import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./column-header";

export interface LibraryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "component" | "module" | "agent";
  price_cents_indicative: number | null;
  price_note: string | null;
  built_for: string[];
  stack: string | null;
  source_ref: string | null;
  tags: string[];
  is_active: boolean;
  times_sold: number;
  last_sold_price_cents: number | null;
  sort_order: number;
  created_at: string;
}

export const categoryLabels: Record<LibraryRow["category"], string> = {
  component: "Component",
  module: "Module",
  agent: "Agent",
};

const categoryStyles: Record<LibraryRow["category"], string> = {
  component: "bg-accent-soft text-text-muted",
  module: "bg-blue-bg text-blue",
  agent: "bg-green-bg text-green",
};

export function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export const libraryColumns: ColumnDef<LibraryRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Naam" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-text">{row.original.name}</p>
        <p className="text-xs text-text-muted">{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Categorie",
    cell: ({ row }) => (
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryStyles[row.original.category]}`}
      >
        {categoryLabels[row.original.category]}
      </span>
    ),
  },
  {
    accessorKey: "price_cents_indicative",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Indicatie" />,
    cell: ({ row }) =>
      row.original.price_cents_indicative != null ? (
        <span className="font-medium text-text">
          {row.original.price_note ? `${row.original.price_note} ` : ""}
          {formatCents(row.original.price_cents_indicative)}
        </span>
      ) : (
        <span className="text-text-muted">-</span>
      ),
  },
  {
    accessorKey: "built_for",
    header: "Gebruikt bij",
    cell: ({ row }) =>
      row.original.built_for.length > 0 ? (
        <span className="text-sm text-text-secondary">
          {row.original.built_for.join(", ")}
        </span>
      ) : (
        <span className="text-text-muted">-</span>
      ),
  },
  {
    accessorKey: "times_sold",
    header: "Verkocht",
    cell: ({ row }) => <span className="tabular-nums">{row.original.times_sold}x</span>,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) =>
      row.original.is_active ? (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-bg text-green">
          Actief
        </span>
      ) : (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-soft text-text-muted">
          Inactief
        </span>
      ),
  },
];
