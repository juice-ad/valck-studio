import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AdminTable, type Column } from "@/components/admin/AdminTable";

interface BriefRow {
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

export function AdminBriefs() {
  const navigate = useNavigate();
  const [briefs, setBriefs] = useState<BriefRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("discovery_briefs")
      .select("id, business_name, status, submitted_at, created_at, clients(company_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBriefs((data as unknown as BriefRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const columns: Column<BriefRow>[] = [
    { key: "business_name", label: "Bedrijf" },
    {
      key: "clients",
      label: "Organisatie",
      render: (row) => row.clients?.company_name ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[row.status] ?? ""}`}>
          {statusLabels[row.status] ?? row.status}
        </span>
      ),
    },
    {
      key: "submitted_at",
      label: "Ingediend",
      render: (row) => row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("nl-NL") : "—",
    },
    {
      key: "created_at",
      label: "Aangemaakt",
      render: (row) => new Date(row.created_at).toLocaleDateString("nl-NL"),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Intakes</h1>
      <AdminTable
        columns={columns}
        data={briefs}
        loading={loading}
        searchPlaceholder="Zoek intake..."
        searchFields={["business_name"]}
        onRowClick={(row) => navigate(`/admin/briefs/${row.id}`)}
        emptyMessage="Geen intakes gevonden."
      />
    </div>
  );
}
