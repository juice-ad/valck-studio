import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, MessageCircle, Receipt } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ProjectUpdate, Message } from "@/types/portal";

export function Dashboard() {
  const { profile, user } = useAuth();
  const [projectCount, setProjectCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState<ProjectUpdate[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [projects, messages, invoices, updates, msgs] = await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("client_id", user!.id),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("sender_id", user!.id),
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("client_id", user!.id)
          .eq("status", "verstuurd"),
        supabase
          .from("project_updates")
          .select("*, projects!inner(client_id)")
          .eq("projects.client_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("messages")
          .select("*")
          .eq("sender_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setProjectCount(projects.count ?? 0);
      setMessageCount(messages.count ?? 0);
      setInvoiceCount(invoices.count ?? 0);
      setRecentUpdates((updates.data as ProjectUpdate[]) ?? []);
      setRecentMessages((msgs.data as Message[]) ?? []);
    }

    load();
  }, [user]);

  const stats = [
    {
      label: "Actieve projecten",
      value: projectCount,
      icon: FolderKanban,
      to: "/portal/projecten",
    },
    {
      label: "Berichten",
      value: messageCount,
      icon: MessageCircle,
      to: "/portal/berichten",
    },
    {
      label: "Openstaande facturen",
      value: invoiceCount,
      icon: Receipt,
      to: "/portal/facturen",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">
        Welkom terug, {profile?.full_name?.split(" ")[0] || "daar"}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-[12px] bg-bg-white border border-border-light p-6 no-underline hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon size={20} className="text-text-muted" />
              <span className="text-sm text-text-secondary">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold text-text">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Recente updates
          </h2>
          {recentUpdates.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen updates.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentUpdates.map((u) => (
                <div key={u.id} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-text">{u.title}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(u.created_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Laatste berichten
          </h2>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen berichten.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentMessages.map((m) => (
                <div key={m.id} className="flex flex-col gap-1">
                  <p className="text-sm text-text line-clamp-1">{m.body}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(m.created_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
