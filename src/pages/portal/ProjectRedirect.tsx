import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";

export function ProjectRedirect() {
  const { activeClientId, loading: clientLoading } = useActiveClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (clientLoading || !activeClientId) return;
    supabase.from("projects").select("id").eq("client_id", activeClientId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { setProjectId(data?.id ?? null); setResolved(true); });
  }, [activeClientId, clientLoading]);

  if (clientLoading || !resolved) return <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  return <Navigate to={projectId ? `/portal/projecten/${projectId}` : "/portal/discovery"} replace />;
}
