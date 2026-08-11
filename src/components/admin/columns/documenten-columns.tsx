import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileText } from "lucide-react";
import { DataTableColumnHeader } from "./column-header";
import { selectColumn } from "./select-column";

export interface DocRow {
  id: string;
  name: string;
  file_url: string;
  client_id: string;
  project_id: string | null;
  created_at: string;
  clients: { company_name: string } | null;
  projects: { title: string } | null;
}

export const documentColumns: ColumnDef<DocRow>[] = [
  selectColumn<DocRow>(),
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Naam" />
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2">
        <FileText size={14} className="text-text-muted" />
        <span className="font-medium">{row.getValue("name")}</span>
      </span>
    ),
  },
  {
    id: "organisation",
    accessorFn: (row) => row.clients?.company_name ?? "",
    header: "Organisatie",
    cell: ({ getValue }) => getValue<string>() || "-",
  },
  {
    id: "project",
    accessorFn: (row) => row.projects?.title ?? "",
    header: "Project",
    cell: ({ getValue }) => getValue<string>() || "-",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Geüpload" />
    ),
    cell: ({ row }) =>
      new Date(row.getValue("created_at")).toLocaleDateString("nl-NL"),
  },
  {
    id: "download",
    header: "",
    cell: ({ row }) => (
      <a
        href={row.original.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Download size={14} /> Download
      </a>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
