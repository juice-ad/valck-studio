import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Building2,
  Users,
  MessageCircle,
  Receipt,
  FileText,
  LogOut,
  Settings,
  ChevronsUpDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navSections = [
  {
    label: "Overzicht",
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Projecten",
    items: [
      { label: "Projecten", to: "/admin/projecten", icon: FolderKanban },
      { label: "Intakes", to: "/admin/briefs", icon: Sparkles },
    ],
  },
  {
    label: "Klanten",
    items: [
      { label: "Organisaties", to: "/admin/clients", icon: Building2 },
      { label: "Gebruikers", to: "/admin/users", icon: Users },
      { label: "Berichten", to: "/admin/berichten", icon: MessageCircle },
    ],
  },
  {
    label: "Financieel",
    items: [
      { label: "Facturen", to: "/admin/facturen", icon: Receipt },
      { label: "Documenten", to: "/admin/documenten", icon: FileText },
    ],
  },
];

interface Props {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: Props) {
  const { pathname } = useLocation();
  const { profile, user, signOut } = useAuth();

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
          to="/admin"
          className="font-bold text-lg tracking-[-0.5px] text-text no-underline"
          onClick={onClose}
        >
          valck
          <span className="font-light text-text-muted ml-1.5">admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
              {section.label}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active =
                  item.to === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.to);
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
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <ChevronsUpDown size={14} className="text-text-muted shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium">{profile?.full_name || "Admin"}</span>
              <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/admin/instellingen">
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
