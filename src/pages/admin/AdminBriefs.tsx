import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DataTable } from "@/components/admin/DataTable";
import { briefColumns, type BriefRow } from "@/components/admin/columns/briefs-columns";

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Intakes</h1>
      <DataTable
        columns={briefColumns}
        data={briefs}
        loading={loading}
        searchPlaceholder="Zoek intake..."
        searchColumn="business_name"
        onRowClick={(row) => navigate(`/admin/briefs/${row.id}`)}
        emptyMessage="Geen intakes gevonden."
      />
    </div>
  );
}
