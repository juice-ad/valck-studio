import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Sparkles,
  Eye,
  MessageCircle,
  Plus,
  UserPlus,
  Receipt,
  TrendingUp,
  CreditCard,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Button } from "@/components/ui/button";

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

interface RecentPayment {
  id: string;
  number: string;
  amount_cents: number;
  paid_at: string;
  payment_method: string | null;
  clients: { company_name: string } | null;
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export function AdminDashboard() {
  const [projectCount, setProjectCount] = useState(0);
  const [briefCount, setBriefCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [openInvoiceCount, setOpenInvoiceCount] = useState(0);
  const [recentBriefs, setRecentBriefs] = useState<RecentBrief[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        projects,
        briefs,
        reviews,
        messages,
        paidThisMonth,
        openInvoices,
        briefList,
        feedbackList,
        paymentList,
      ] = await Promise.all([
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
        // Revenue this month (paid invoices)
        supabase
          .from("invoices")
          .select("amount_cents")
          .eq("status", "betaald")
          .gte("paid_at", startOfMonth),
        // Open invoices count
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .in("status", ["verstuurd", "concept"]),
        // Recent briefs
        supabase
          .from("discovery_briefs")
          .select("id, business_name, status, submitted_at, clients(company_name)")
          .in("status", ["submitted", "reviewed"])
          .order("submitted_at", { ascending: false })
          .limit(5),
        // Recent feedback
        supabase
          .from("preview_feedback")
          .select("id, body, category, rating, created_at, projects(title)")
          .order("created_at", { ascending: false })
          .limit(5),
        // Recent payments
        supabase
          .from("invoices")
          .select("id, number, amount_cents, paid_at, payment_method, clients(company_name)")
          .eq("status", "betaald")
          .not("paid_at", "is", null)
          .order("paid_at", { ascending: false })
          .limit(5),
      ]);

      setProjectCount(projects.count ?? 0);
      setBriefCount(briefs.count ?? 0);
      setReviewCount(reviews.count ?? 0);
      setMessageCount(messages.count ?? 0);
      setOpenInvoiceCount(openInvoices.count ?? 0);

      // Sum revenue
      const monthlyRevenue = (paidThisMonth.data ?? []).reduce(
        (sum: number, inv: { amount_cents: number }) => sum + inv.amount_cents,
        0
      );
      setRevenueThisMonth(monthlyRevenue);

      setRecentBriefs((briefList.data as unknown as RecentBrief[]) ?? []);
      setRecentFeedback((feedbackList.data as unknown as RecentFeedback[]) ?? []);
      setRecentPayments((paymentList.data as unknown as RecentPayment[]) ?? []);
    }

    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <span className="text-xs text-text-muted hidden sm:block">
          ⌘K om te zoeken
        </span>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <AdminStatCard label="Omzet deze maand" value={formatCents(revenueThisMonth)} icon={TrendingUp} to="/admin/facturen" />
        <AdminStatCard label="Openstaande facturen" value={openInvoiceCount} icon={Receipt} to="/admin/facturen" />
        <AdminStatCard label="Actieve projecten" value={projectCount} icon={FolderKanban} to="/admin/projecten" />
        <AdminStatCard label="Ingediende intakes" value={briefCount} icon={Sparkles} to="/admin/briefs" />
      </div>

      {/* Activity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStatCard label="Open reviews" value={reviewCount} icon={Eye} to="/admin/projecten" />
        <AdminStatCard label="Klantberichten" value={messageCount} icon={MessageCircle} to="/admin/berichten" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button asChild>
          <Link to="/admin/projecten">
            <Plus size={16} />
            Nieuw project
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/clients">
            <UserPlus size={16} />
            Klant uitnodigen
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/facturen">
            <CreditCard size={16} />
            Nieuwe factuur
          </Link>
        </Button>
      </div>

      {/* Recent activity — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent payments */}
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">Recente betalingen</h2>
            <Link to="/admin/facturen" className="text-xs text-text-muted hover:text-text no-underline transition-colors">
              Alle facturen
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-text-muted">Nog geen betalingen ontvangen.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-[8px] border border-border-light">
                  <div>
                    <p className="text-sm font-medium text-text">{payment.number}</p>
                    <p className="text-xs text-text-muted">{payment.clients?.company_name ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green">{formatCents(payment.amount_cents)}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1 justify-end">
                      <Clock size={10} />
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("nl-NL") : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
