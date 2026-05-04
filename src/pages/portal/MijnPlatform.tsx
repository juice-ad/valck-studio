import { useEffect, useState } from "react";
import { ExternalLink, Globe, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
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

export function MijnPlatform() {
  const { activeClientId } = useActiveClient();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClientId) return;

    supabase
      .from("platforms")
      .select("*")
      .eq("client_id", activeClientId)
      .limit(1)
      .single()
      .then(({ data }) => {
        setPlatform(data as Platform | null);
        setLoading(false);
      });
  }, [activeClientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!platform) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text mb-6">Mijn Platform</h1>
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <Globe size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">
            Je platform is nog in ontwikkeling. Bekijk je projectstatus voor updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Mijn Platform</h1>

      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text">{platform.name}</h2>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[platform.status]}`}
          >
            {statusLabels[platform.status]}
          </span>
        </div>

        {/* URL */}
        {platform.live_url && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-text-muted uppercase mb-1">
              URL
            </p>
            <a
              href={platform.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-text font-medium hover:underline"
            >
              {platform.live_url}
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Accent color */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-text-muted uppercase mb-2">
            Accent kleur
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-[6px] border border-border-light"
              style={{ backgroundColor: platform.accent_color }}
            />
            <span className="text-sm text-text-secondary font-mono">
              {platform.accent_color}
            </span>
          </div>
        </div>

        {/* Modules */}
        {platform.modules.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase mb-2">
              <Layers size={12} className="inline mr-1" />
              Actieve modules
            </p>
            <div className="flex flex-wrap gap-2">
              {platform.modules.map((mod) => (
                <span
                  key={mod}
                  className="text-xs bg-accent-soft text-text px-2.5 py-1 rounded-full"
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
