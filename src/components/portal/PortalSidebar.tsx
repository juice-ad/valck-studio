import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FolderKanban,
  MessageCircle,
  FileText,
  Receipt,
  LogOut,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Project", to: "/portal/project", icon: FolderKanban, hasNotification: true },
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
          const active = item.to === "/portal/project"
            ? pathname.startsWith("/portal/project") || pathname.startsWith("/portal/discovery")
            : pathname.startsWith(item.to);
          const showDot = item.hasNotification && hasOpenReviews;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm no-underline transition-colors focus-visible:ring-2 focus-visible:ring-text/30 ${
                active
                  ? "bg-accent-soft font-semibold text-text"
                  : "text-text-secondary hover:text-text hover:bg-accent-soft/50"
              }`}
            >
              <item.icon size={18} />
              {item.label}
              {showDot && (
                <span className="w-2 h-2 rounded-full bg-blue ml-auto animate-pulse-dot" aria-label="Actie vereist" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer with dropdown */}
      <div className="px-3 py-4 border-t border-border-light">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2 rounded-[8px] hover:bg-accent-soft/50 transition-colors w-full text-left">
              <div className="w-8 h-8 rounded-full bg-text text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">
                  {profile?.full_name || "Gebruiker"}
                </p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <ChevronsUpDown size={14} className="text-text-muted shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium">{profile?.full_name || "Gebruiker"}</span>
              <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/portal/instellingen">
                  <Settings size={14} />
                  Instellingen
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut size={14} />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
