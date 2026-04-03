import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  MessageCircle,
  FileText,
  Receipt,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Intake", to: "/portal/discovery", icon: Sparkles },
  { label: "Projecten", to: "/portal/projecten", icon: FolderKanban, hasNotification: true },
  { label: "Berichten", to: "/portal/berichten", icon: MessageCircle },
  { label: "Documenten", to: "/portal/documenten", icon: FileText },
  { label: "Facturen", to: "/portal/facturen", icon: Receipt },
];

interface Props {
  onClose?: () => void;
}

export function PortalSidebar({ onClose }: Props) {
  const { pathname } = useLocation();
  const { profile, user, signOut } = useAuth();
  const { activeClientId } = useActiveClient();
  const [hasOpenReviews, setHasOpenReviews] = useState(false);

  // Check for open review rounds
  useEffect(() => {
    if (!activeClientId) return;

    async function checkReviews() {
      const { count } = await supabase
        .from("review_rounds")
        .select("id, projects!inner(client_id)", { count: "exact", head: true })
        .eq("projects.client_id", activeClientId!)
        .in("status", ["pending", "active"]);

      setHasOpenReviews((count ?? 0) > 0);
    }

    checkReviews();
  }, [activeClientId]);

  const displayName = profile?.full_name || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full w-64 bg-bg-white border-r border-border-light">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-border-light">
        <Link
          to="/"
          className="font-bold text-lg tracking-[-0.5px] text-text no-underline"
          onClick={onClose}
        >
          valck
          <span className="font-light text-text-muted ml-1.5">studio</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.to);
          const showDot = item.hasNotification && hasOpenReviews;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm no-underline transition-colors ${
                active
                  ? "bg-accent-soft font-semibold text-text"
                  : "text-text-secondary hover:text-text hover:bg-accent-soft/50"
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {showDot && (
                <span className="w-2 h-2 rounded-full bg-blue ml-auto animate-pulse-dot" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-border-light">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-text text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {profile?.full_name || "Gebruiker"}
            </p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text rounded-[8px] hover:bg-accent-soft/50 transition-colors w-full"
        >
          <LogOut size={16} />
          Uitloggen
        </button>
      </div>
    </div>
  );
}
