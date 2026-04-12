export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import { Users, DollarSign, Activity, Cpu } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = createAdminClient();

  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // New users today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: newToday } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // New users this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const { count: newThisWeek } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStart.toISOString());

  // Subscription breakdown
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("subscription_status");

  const statusCounts: Record<string, number> = {};
  for (const p of allProfiles ?? []) {
    const status = p.subscription_status ?? "none";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const activeSubs = (statusCounts["active"] ?? 0) + (statusCounts["trialing"] ?? 0);
  const trialingSubs = statusCounts["trialing"] ?? 0;
  const cancelledSubs = statusCounts["canceled"] ?? 0;
  const pricePerMonth = 14.99;
  const mrr = (statusCounts["active"] ?? 0) * pricePerMonth + trialingSubs * pricePerMonth;

  // Conversion rate: if we had any trials that converted
  const totalEverTrialed = trialingSubs + (statusCounts["active"] ?? 0) + cancelledSubs;
  const conversionRate =
    totalEverTrialed > 0
      ? Math.round(((statusCounts["active"] ?? 0) / totalEverTrialed) * 100)
      : 0;

  // API usage this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: apiLogs } = await supabase
    .from("api_usage_logs")
    .select("cost_usd, input_tokens, output_tokens")
    .gte("created_at", monthStart.toISOString());

  const apiCallsThisMonth = apiLogs?.length ?? 0;
  const apiCostThisMonth = (apiLogs ?? []).reduce(
    (sum, l) => sum + (l.cost_usd ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav email={session.email} role={session.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero metrics */}
        <div className="bg-obsidian rounded-[14px] p-6 mb-6">
          <h1 className="text-lg font-medium text-white mb-4">
            Dashboard Overview
          </h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Users className="h-5 w-5 text-lime" />}
              label="Total Users"
              value={String(totalUsers ?? 0)}
            />
            <MetricCard
              icon={<DollarSign className="h-5 w-5 text-lime" />}
              label="MRR"
              value={`$${mrr.toFixed(2)}`}
            />
            <MetricCard
              icon={<Activity className="h-5 w-5 text-lime" />}
              label="Active Subs"
              value={String(activeSubs)}
            />
            <MetricCard
              icon={<Cpu className="h-5 w-5 text-lime" />}
              label="API Cost (Month)"
              value={`$${apiCostThisMonth.toFixed(4)}`}
            />
          </div>
        </div>

        {/* Detail cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DetailCard title="User Growth">
            <StatRow label="New today" value={String(newToday ?? 0)} />
            <StatRow label="New this week" value={String(newThisWeek ?? 0)} />
            <StatRow label="Total" value={String(totalUsers ?? 0)} />
          </DetailCard>

          <DetailCard title="Subscription Breakdown">
            <StatRow
              label="Active"
              value={String(statusCounts["active"] ?? 0)}
            />
            <StatRow label="Trialing" value={String(trialingSubs)} />
            <StatRow label="Cancelled" value={String(cancelledSubs)} />
            <StatRow
              label="No subscription"
              value={String(statusCounts["none"] ?? (totalUsers ?? 0) - activeSubs - cancelledSubs)}
            />
          </DetailCard>

          <DetailCard title="Conversion & Revenue">
            <StatRow label="Trial to Paid" value={`${conversionRate}%`} />
            <StatRow label="MRR" value={`$${mrr.toFixed(2)}`} />
            <StatRow
              label="Est. ARR"
              value={`$${(mrr * 12).toFixed(2)}`}
            />
          </DetailCard>

          <DetailCard title="API Usage (This Month)">
            <StatRow label="Total calls" value={String(apiCallsThisMonth)} />
            <StatRow
              label="Total cost"
              value={`$${apiCostThisMonth.toFixed(4)}`}
            />
            <StatRow
              label="Avg cost/call"
              value={
                apiCallsThisMonth > 0
                  ? `$${(apiCostThisMonth / apiCallsThisMonth).toFixed(4)}`
                  : "$0"
              }
            />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 rounded-[10px] p-4">
      <div className="flex items-center gap-2 mb-1">{icon}</div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[10px] border border-black/5 p-5">
      <h3 className="text-sm font-medium text-obsidian mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-mgray">{label}</span>
      <span className="font-medium text-obsidian">{value}</span>
    </div>
  );
}
