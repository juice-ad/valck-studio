import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./column-header";
import { selectColumn } from "./select-column";

export interface ClientRow {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  created_at: string;
  projects: { count: number }[];
  user_client_memberships: { count: number }[];
}

export const clientColumns: ColumnDef<ClientRow>[] = [
  selectColumn<ClientRow>(),
  {
    accessorKey: "company_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Organisatie" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("company_name")}</span>
    ),
  },
  {
    accessorKey: "contact_person",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contactpersoon" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-mail" />
    ),
  },
  {
    id: "projects_count",
    accessorFn: (row) => row.projects?.[0]?.count ?? 0,
    header: "Projecten",
    cell: ({ getValue }) => getValue<number>(),
    enableSorting: false,
  },
  {
    id: "users_count",
    accessorFn: (row) => row.user_client_memberships?.[0]?.count ?? 0,
    header: "Users",
    cell: ({ getValue }) => getValue<number>(),
    enableSorting: false,
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
