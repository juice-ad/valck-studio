import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: Props) {
  const { profile, user } = useAuth();

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
        to="/admin"
        className="font-bold text-lg tracking-[-0.5px] text-text no-underline"
      >
        valck
        <span className="font-light text-text-muted ml-1.5">admin</span>
      </Link>

      <div className="w-8 h-8 rounded-full bg-text text-white text-xs font-semibold flex items-center justify-center">
        {initials}
      </div>
    </header>
  );
}
