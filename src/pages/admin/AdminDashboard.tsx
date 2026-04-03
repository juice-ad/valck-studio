import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Sparkles, Eye, MessageCircle, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

interface RecentBrief {
  id: string;
  business_name: string;
  status: string;
  submitted_at: string | null;
  clients: { company_name: string } | null;
}

interface RecentFeedback {
  id: string;
  body: string;
  category: string | null;
  rating: number | null;
  created_at: string;
  projects: { title: string } | null;
}

export function AdminDashboard() {
  const [projectCount, setProjectCount] = useState(0);
  const [briefCount, setBriefCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [recentBriefs, setRecentBriefs] = useState<RecentBrief[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);

  useEffect(() => {
    async function load() {
      const [projects, briefs, reviews, messages, briefList, feedbackList] =
        await Promise.all([
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .neq("phase", "completed"),
          supabase
            .from("discovery_briefs")
            .select("id", { count: "exact", head: true })
            .eq("status", "submitted"),
          supabase
            .from("review_rounds")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "active"]),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("is_from_studio", false),
          supabase
            .from("discovery_briefs")
            .select("id, business_name, status, submitted_at, clients(company_name)")
            .in("status", ["submitted", "reviewed"])
            .order("submitted_at", { ascending: false })
            .limit(5),
          supabase
            .from("preview_feedback")
            .select("id, body, category, rating, created_at, projects(title)")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setProjectCount(projects.count ?? 0);
      setBriefCount(briefs.count ?? 0);
      setReviewCount(reviews.count ?? 0);
      setMessageCount(messages.count ?? 0);
      setRecentBriefs((briefList.data as unknown as RecentBrief[]) ?? []);
      setRecentFeedback((feedbackList.data as unknown as RecentFeedback[]) ?? []);
    }

    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStatCard label="Actieve projecten" value={projectCount} icon={FolderKanban} to="/admin/projecten" />
        <AdminStatCard label="Ingediende intakes" value={briefCount} icon={Sparkles} to="/admin/briefs" />
        <AdminStatCard label="Open reviews" value={reviewCount} icon={Eye} to="/admin/projecten" />
        <AdminStatCard label="Klantberichten" value={messageCount} icon={MessageCircle} to="/admin/berichten" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/admin/projecten"
          className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold no-underline hover:bg-[#333] transition-colors"
        >
          <Plus size={16} />
          Nieuw project
        </Link>
        <Link
          to="/admin/clients"
          className="inline-flex items-center gap-2 border border-border-light rounded-[8px] px-4 py-2.5 text-sm font-semibold text-text no-underline hover:bg-accent-soft transition-colors"
        >
          <UserPlus size={16} />
          Klant uitnodigen
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent briefs */}
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Recente intakes</h2>
            <Link to="/admin/briefs" className="text-xs text-text-muted hover:text-text no-underline transition-colors">
              Alles bekijken
            </Link>
          </div>
          {recentBriefs.length === 0 ? (
            <p className="text-sm text-text-muted">Geen ingediende intakes.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentBriefs.map((brief) => (
                <Link
                  key={brief.id}
                  to={`/admin/briefs/${brief.id}`}
                  className="flex items-center justify-between p-3 rounded-[8px] border border-border-light no-underline hover:bg-accent-soft/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text">{brief.business_name}</p>
                    <p className="text-xs text-text-muted">{brief.clients?.company_name ?? "—"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    brief.status === "submitted" ? "bg-blue-bg text-blue" : "bg-green-bg text-green"
                  }`}>
                    {brief.status === "submitted" ? "Nieuw" : "Beoordeeld"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent feedback */}
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Recente feedback</h2>
            <Link to="/admin/projecten" className="text-xs text-text-muted hover:text-text no-underline transition-colors">
              Alles bekijken
            </Link>
          </div>
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen feedback ontvangen.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentFeedback.map((fb) => (
                <div key={fb.id} className="p-3 rounded-[8px] border border-border-light">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-text-muted">{fb.projects?.title ?? "Project"}</p>
                    {fb.category && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-soft text-text-muted">
                        {fb.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text line-clamp-2">{fb.body}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(fb.created_at).toLocaleDateString("nl-NL")}
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
