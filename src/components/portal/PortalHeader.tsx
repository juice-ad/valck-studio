import { Link } from "react-router-dom";
import { Menu, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/portal/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onMenuToggle: () => void;
}

export function PortalHeader({ onMenuToggle }: Props) {
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="md:hidden flex items-center justify-between h-14 px-4 bg-bg-white border-b border-border-light">
      <button
        onClick={onMenuToggle}
        className="p-2 text-text"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      <Link
        to="/"
        className="font-bold text-lg tracking-[-0.5px] text-text no-underline"
      >
        valck
        <span className="font-light text-text-muted ml-1.5">studio</span>
      </Link>

      <div className="flex items-center gap-1">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 rounded-full bg-text text-white text-xs font-semibold flex items-center justify-center">
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-56">
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
    </header>
  );
}
