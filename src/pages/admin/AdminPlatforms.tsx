import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Platform, PlatformStatus } from "@/types/portal";

const statusStyles: Record<PlatformStatus, string> = {
  development: "bg-yellow-50 text-yellow-700",
  staging: "bg-blue-bg text-blue",
  live: "bg-green-bg text-green",
  maintenance: "bg-orange-50 text-orange-700",
};

const statusLabels: Record<PlatformStatus, string> = {
  development: "In ontwikkeling",
  staging: "Staging",
  live: "Live",
  maintenance: "Onderhoud",
};

type PlatformWithClient = Platform & {
  client: { company_name: string } | null;
};

export function AdminPlatforms() {
  const [platforms, setPlatforms] = useState<PlatformWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("platforms")
      .select("*, client:clients(company_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlatforms((data as PlatformWithClient[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Platforms</h1>

      {platforms.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">
            Nog geen platforms geregistreerd.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="rounded-[12px] bg-bg-white border border-border-light p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-border-light"
                    style={{ backgroundColor: p.accent_color }}
                  />
                  <h3 className="text-sm font-semibold text-text">{p.name}</h3>
                  <span className="text-xs text-text-muted">
                    {p.client?.company_name}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[p.status]}`}
                >
                  {statusLabels[p.status]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                {p.live_url && (
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-text"
                  >
                    {p.live_url} <ExternalLink size={12} />
                  </a>
                )}
                <span>{p.modules.length} modules</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
