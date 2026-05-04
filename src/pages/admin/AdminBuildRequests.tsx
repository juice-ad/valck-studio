import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { BuildRequest, BuildRequestStatus } from "@/types/portal";

const columns: { status: BuildRequestStatus; label: string; color: string }[] = [
  { status: "ingediend", label: "Ingediend", color: "border-t-blue" },
  { status: "in_scoping", label: "In Scoping", color: "border-t-purple-500" },
  { status: "offerte", label: "Offerte", color: "border-t-yellow-500" },
  { status: "akkoord", label: "Akkoord", color: "border-t-green" },
  { status: "in_bouw", label: "In Bouw", color: "border-t-orange-500" },
  { status: "opgeleverd", label: "Opgeleverd", color: "border-t-text-muted" },
];

type RequestWithClient = BuildRequest & {
  client: { company_name: string } | null;
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export function AdminBuildRequests() {
  const [requests, setRequests] = useState<RequestWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("build_requests")
      .select("*, client:clients(company_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRequests((data as RequestWithClient[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Build Requests</h1>

      {/* Pipeline view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {columns.map((col) => {
          const items = requests.filter((r) => r.status === col.status);
          return (
            <div key={col.status}>
              <div
                className={`border-t-2 ${col.color} rounded-t-[8px] bg-accent-soft/30 px-3 py-2 mb-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text">
                    {col.label}
                  </span>
                  <span className="text-xs text-text-muted">{items.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((req) => (
                  <Link
                    key={req.id}
                    to={`/admin/build-requests/${req.id}`}
                    className="block rounded-[8px] bg-bg-white border border-border-light p-3 hover:shadow-sm transition-shadow no-underline"
                  >
                    <p className="text-sm font-medium text-text mb-1 line-clamp-2">
                      {req.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {req.client?.company_name}
                    </p>
                    {req.quoted_amount_cents && (
                      <p className="text-xs font-medium text-text mt-1">
                        {formatCents(req.quoted_amount_cents)}
                      </p>
                    )}
                  </Link>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4">
                    Geen items
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
