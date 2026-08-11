import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Megaphone, Eye, Calendar, MessageSquare } from "lucide-react";
import { fetchActivity, type ActivityKind, type ActivityItem } from "@/lib/activity";

const ICONS: Record<ActivityKind, typeof Activity> = {
  update: Megaphone,
  review: Eye,
  meeting: Calendar,
  reply: MessageSquare,
};

export function ActivityFeed({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [lastVisit, setLastVisit] = useState(0);

  useEffect(() => {
    const key = `valck:lastvisit:${projectId}`;
    setLastVisit(Number(localStorage.getItem(key) ?? 0));
    fetchActivity(projectId).then(setItems);
    // Markeer dit bezoek - volgende keer is "nieuw sinds" hierop gebaseerd
    localStorage.setItem(key, String(Date.now()));
  }, [projectId]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-[12px] bg-bg-white border border-border-light p-5">
      <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <Activity size={15} /> Sinds je laatste bezoek
      </h2>
      <div className="flex flex-col">
        {items.map((it, i) => {
          const Icon = ICONS[it.kind];
          const isNew = lastVisit > 0 && new Date(it.at).getTime() > lastVisit;
          const inner = (
            <div className="flex items-start gap-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text leading-snug">
                  {it.title}
                  {isNew && <span className="ml-2 text-[10px] font-bold text-blue align-middle">NIEUW</span>}
                </p>
                {it.subtitle && <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{it.subtitle}</p>}
                <p className="text-[11px] text-text-muted mt-0.5">
                  {new Date(it.at).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                </p>
              </div>
            </div>
          );
          return it.link ? (
            <Link key={it.id} to={it.link} className={`no-underline hover:bg-bg rounded-[6px] transition-colors ${i > 0 ? "border-t border-border-light" : ""}`}>
              {inner}
            </Link>
          ) : (
            <div key={it.id} className={i > 0 ? "border-t border-border-light" : ""}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
