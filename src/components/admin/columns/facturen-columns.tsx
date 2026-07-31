import type { ColumnDef } from "@tanstack/react-table";
import type { InvoiceStatus } from "@/types/portal";
import { DataTableColumnHeader } from "./column-header";
import { selectColumn } from "./select-column";

export interface InvoiceRow {
  id: string;
  number: string;
  description: string | null;
  amount_cents: number;
  status: InvoiceStatus;
  due_date: string | null;
  client_id: string;
  created_at: string;
  clients: { company_name: string } | null;
  mollie_payment_link_url: string | null;
  mollie_payment_link_id: string | null;
  paid_at: string | null;
  payment_method: string | null;
  moneybird_invoice_id: string | null;
  line_items: { description: string; quantity: number; price_cents: number }[];
}

export const statusLabels: Record<InvoiceStatus, string> = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  betaald: "Betaald",
  vervallen: "Vervallen",
};

export const statusStyles: Record<InvoiceStatus, string> = {
  concept: "bg-accent-soft text-text-muted",
  verstuurd: "bg-blue-bg text-blue",
  betaald: "bg-green-bg text-green",
  vervallen: "bg-red-50 text-red-600",
};

export function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  selectColumn<InvoiceRow>(),
  {
    accessorKey: "number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nummer" />
    ),
    cell: ({ row }) => (
      <span className="font-medium whitespace-nowrap">
        {row.getValue("number")}
      </span>
    ),
  },
  {
    id: "organisation",
    accessorFn: (row) => row.clients?.company_name ?? "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organisatie" />
    ),
    cell: ({ getValue }) => getValue<string>() || "—",
  },
  {
    accessorKey: "description",
    header: "Omschrijving",
    cell: ({ row }) => row.getValue("description") || "—",
  },
  {
    accessorKey: "amount_cents",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bedrag" />
    ),
    cell: ({ row }) => (
      <span className="font-medium whitespace-nowrap">
        {formatCents(row.getValue("amount_cents"))}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as InvoiceStatus;
      return (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[status]}`}
        >
          {statusLabels[status]}
        </span>
      );
    },
    filterFn: (row, _id, value: string[]) =>
      value.includes(row.getValue("status")),
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vervaldatum" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("due_date") as string | null;
      return date ? new Date(date).toLocaleDateString("nl-NL") : "—";
    },
  },
];
