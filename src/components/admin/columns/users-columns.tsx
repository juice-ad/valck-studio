import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./column-header";
import { selectColumn } from "./select-column";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_admin: boolean;
  linked_client_id: string | null;
  created_at: string;
  clients: { company_name: string } | null;
}

export const userColumns: ColumnDef<UserRow>[] = [
  selectColumn<UserRow>(),
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Naam" />
    ),
    cell: ({ row }) => row.getValue("full_name") || "-",
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-mail" />
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            role === "admin"
              ? "bg-accent-soft text-text"
              : "bg-blue-bg text-blue"
          }`}
        >
          {role}
        </span>
      );
    },
  },
  {
    id: "organisation",
    accessorFn: (row) => row.clients?.company_name ?? "",
    header: "Organisatie",
    cell: ({ getValue }) => getValue<string>() || "-",
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
