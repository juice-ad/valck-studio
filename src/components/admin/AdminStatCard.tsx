import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  to?: string;
}

export function AdminStatCard({ label, value, icon: Icon, to }: AdminStatCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-3 mb-3">
        <Icon size={20} className="text-text-muted" />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="text-3xl font-bold text-text">{value}</p>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="rounded-[12px] bg-bg-white border border-border-light p-6 no-underline hover:shadow-md transition-shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
      {content}
    </div>
  );
}
