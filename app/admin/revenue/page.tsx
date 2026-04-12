export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminRevenuePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = createAdminClient();

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("subscription_status, created_at");

  const statusCounts: Record<string, number> = {};
  for (const p of allProfiles ?? []) {
    const status = p.subscription_status ?? "none";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const pricePerMonth = 14.99;
  const activePaid = statusCounts["active"] ?? 0;
  const trialing = statusCounts["trialing"] ?? 0;
  const canceled = statusCounts["canceled"] ?? 0;
  const noSub = (allProfiles?.length ?? 0) - activePaid - trialing - canceled;

  const mrr = (activePaid + trialing) * pricePerMonth;
  const arr = mrr * 12;

  // Estimate total revenue (simplified: active users * price * avg months)
  // For MVP we just show MRR-based projections
  const totalEverPaid = activePaid + canceled;
  const estTotalRevenue = totalEverPaid * pricePerMonth * 3; // rough estimate

  const conversionRate =
    activePaid + trialing + canceled > 0
      ? Math.round(
          (activePaid / (activePaid + trialing + canceled)) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav email={session.email} role={session.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero */}
        <div className="bg-obsidian rounded-[14px] p-6 mb-6">
          <h1 className="text-lg font-medium text-white mb-4">Revenue</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HeroMetric label="MRR" value={`$${mrr.toFixed(2)}`} />
            <HeroMetric label="ARR (est)" value={`$${arr.toFixed(2)}`} />
            <HeroMetric
              label="Total Revenue (est)"
              value={`$${estTotalRevenue.toFixed(2)}`}
            />
            <HeroMetric
              label="Conversion Rate"
              value={`${conversionRate}%`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Subscription breakdown */}
          <div className="bg-white rounded-[10px] border border-black/5 p-5">
            <h3 className="text-sm font-medium text-obsidian mb-4">
              Subscription Breakdown
            </h3>
            <div className="space-y-3">
              <BreakdownBar
                label="Active"
                count={activePaid}
                total={allProfiles?.length ?? 1}
                color="bg-lime"
              />
              <BreakdownBar
                label="Trialing"
                count={trialing}
                total={allProfiles?.length ?? 1}
                color="bg-blue-400"
              />
              <BreakdownBar
                label="Cancelled"
                count={canceled}
                total={allProfiles?.length ?? 1}
                color="bg-alert"
              />
              <BreakdownBar
                label="No Subscription"
                count={noSub}
                total={allProfiles?.length ?? 1}
                color="bg-muted"
              />
            </div>
          </div>

          {/* Revenue details */}
          <div className="bg-white rounded-[10px] border border-black/5 p-5">
            <h3 className="text-sm font-medium text-obsidian mb-4">
              Revenue Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-mgray">Price per month</span>
                <span className="font-medium text-obsidian">$14.99</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mgray">Paying subscribers</span>
                <span className="font-medium text-obsidian">{activePaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mgray">Trialing</span>
                <span className="font-medium text-obsidian">{trialing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mgray">Cancelled</span>
                <span className="font-medium text-obsidian">{canceled}</span>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-2 mt-2">
                <span className="text-mgray font-medium">Monthly Revenue</span>
                <span className="font-semibold text-obsidian">
                  ${mrr.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-4">
              Note: Revenue calculated from profiles table. No Stripe API
              integration yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-[10px] p-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

function BreakdownBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-mgray">{label}</span>
        <span className="font-medium text-obsidian">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
