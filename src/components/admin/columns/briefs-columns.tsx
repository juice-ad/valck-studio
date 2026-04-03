import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./column-header";

export interface BriefRow {
  id: string;
  business_name: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  clients: { company_name: string } | null;
}

const statusLabels: Record<string, string> = {
  draft: "Concept",
  submitted: "Ingediend",
  reviewed: "Beoordeeld",
};

const statusStyles: Record<string, string> = {
  draft: "bg-accent-soft text-text-muted",
  submitted: "bg-blue-bg text-blue",
  reviewed: "bg-green-bg text-green",
};

export const briefColumns: ColumnDef<BriefRow>[] = [
  {
    accessorKey: "business_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bedrijf" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("business_name")}</span>
    ),
  },
  {
    id: "organisation",
    accessorFn: (row) => row.clients?.company_name ?? "",
    header: "Organisatie",
    cell: ({ getValue }) => getValue<string>() || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[status] ?? ""}`}
        >
          {statusLabels[status] ?? status}
        </span>
      );
    },
  },
  {
    accessorKey: "submitted_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ingediend" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("submitted_at") as string | null;
      return date ? new Date(date).toLocaleDateString("nl-NL") : "—";
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aangemaakt" />
    ),
    cell: ({ row }) =>
      new Date(row.getValue("created_at")).toLocaleDateString("nl-NL"),
  },
];
