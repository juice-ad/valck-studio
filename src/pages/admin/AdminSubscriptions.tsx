import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { SubscriptionTier, Subscription } from "@/types/portal";

type SubWithDetails = Subscription & {
  tier: SubscriptionTier;
  client: { company_name: string } | null;
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
  });
}

export function AdminSubscriptions() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [tiersRes, subsRes] = await Promise.all([
        supabase
          .from("subscription_tiers")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("subscriptions")
          .select("*, tier:subscription_tiers(*), client:clients(company_name)")
          .is("end_date", null)
          .order("created_at", { ascending: false }),
      ]);

      if (tiersRes.error) toast.error("Fout bij laden tiers");
      if (subsRes.error) toast.error("Fout bij laden abonnementen");

      setTiers((tiersRes.data as SubscriptionTier[]) ?? []);
      setSubscriptions((subsRes.data as SubWithDetails[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const mrr = subscriptions.reduce(
    (sum, s) => sum + (s.tier?.price_cents ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Abonnementen</h1>
        <div className="text-right">
          <p className="text-xs text-text-muted uppercase font-semibold">MRR</p>
          <p className="text-lg font-bold text-text">{formatCents(mrr)}</p>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {tiers.map((tier) => {
          const count = subscriptions.filter(
            (s) => s.tier_id === tier.id
          ).length;
          return (
            <div
              key={tier.id}
              className="rounded-[12px] bg-bg-white border border-border-light p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text">{tier.name}</h3>
                <span className="text-xs text-text-muted">
                  {count} klant{count !== 1 ? "en" : ""}
                </span>
              </div>
              <p className="text-lg font-bold text-text mb-2">
                {formatCents(tier.price_cents)}{" "}
                <span className="text-xs font-normal text-text-muted">
                  /maand
                </span>
              </p>
              <ul className="space-y-1">
                {(tier.features as string[]).slice(0, 4).map((f, i) => (
                  <li key={i} className="text-xs text-text-secondary">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Active subscriptions */}
      <h2 className="text-lg font-semibold text-text mb-4">
        Actieve abonnementen
      </h2>

      {subscriptions.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">
            Nog geen abonnementen toegewezen.
          </p>
        </div>
      ) : (
        <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Klant
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Bedrag
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Startdatum
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-border-light last:border-b-0"
                >
                  <td className="px-6 py-4 text-sm font-medium text-text">
                    {sub.client?.company_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {sub.tier?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text">
                    {formatCents(sub.tier?.price_cents ?? 0)}/m
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted">
                    {new Date(sub.start_date).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
