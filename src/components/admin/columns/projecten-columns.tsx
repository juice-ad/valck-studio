import type { ColumnDef } from "@tanstack/react-table";
import type { ProjectPhase } from "@/types/portal";
import { DataTableColumnHeader } from "./column-header";
import { selectColumn } from "./select-column";

export interface ProjectRow {
  id: string;
  title: string;
  phase: ProjectPhase;
  start_date: string | null;
  client_id: string;
  created_at: string;
  clients: { company_name: string } | null;
  review_rounds: { count: number }[];
}

const phaseLabels: Record<ProjectPhase, string> = {
  discovery: "Discovery",
  build: "Build",
  scale: "Scale",
  completed: "Afgerond",
};

const phaseStyles: Record<ProjectPhase, string> = {
  discovery: "bg-blue-bg text-blue",
  build: "bg-green-bg text-green",
  scale: "bg-accent-soft text-text",
  completed: "bg-green-bg text-green",
};

export const projectColumns: ColumnDef<ProjectRow>[] = [
  selectColumn<ProjectRow>(),
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("title")}</span>
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
    accessorKey: "phase",
    header: "Fase",
    cell: ({ row }) => {
      const phase = row.getValue("phase") as ProjectPhase;
      return (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${phaseStyles[phase]}`}
        >
          {phaseLabels[phase]}
        </span>
      );
    },
    filterFn: (row, _id, value: string[]) =>
      value.includes(row.getValue("phase")),
  },
  {
    id: "reviews_count",
    accessorFn: (row) => row.review_rounds?.[0]?.count ?? 0,
    header: "Reviews",
    cell: ({ getValue }) => getValue<number>(),
    enableSorting: false,
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Startdatum" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("start_date") as string | null;
      return date ? new Date(date).toLocaleDateString("nl-NL") : "—";
    },
  },
];
