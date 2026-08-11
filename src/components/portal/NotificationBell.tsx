import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveClient } from "@/contexts/ClientContext";
import { fetchNotifications, markAllNotificationsRead } from "@/lib/notifications";
import type { Notification } from "@/types/portal";

export function NotificationBell() {
  const { activeClientId } = useActiveClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!activeClientId) return;
    fetchNotifications(12).then(setNotifications);
  }, [activeClientId]);

  const unread = notifications.filter((n) => !n.read_at);

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-[8px] text-text-secondary hover:text-text hover:bg-accent-soft transition-colors" aria-label="Meldingen">
          <Bell size={18} />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ef4444]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <span className="text-sm font-semibold text-text">Meldingen</span>
          {unread.length > 0 && (
            <button onClick={handleMarkAll} className="text-xs font-medium text-text-muted hover:text-text">
              Alles gelezen
            </button>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-text-muted px-4 py-6 text-center">Nog geen meldingen.</p>
          ) : (
            notifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-bg transition-colors">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? "bg-border-light" : "bg-blue"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-text-muted mt-0.5">{new Date(n.created_at).toLocaleDateString("nl-NL")}</p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} className="block no-underline border-b border-border-light last:border-0">{inner}</Link>
              ) : (
                <div key={n.id} className="border-b border-border-light last:border-0">{inner}</div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
