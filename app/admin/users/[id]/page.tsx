export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import AdminNav from "@/components/admin/AdminNav";
import UserDetailClient from "./UserDetailClient";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const supabase = createAdminClient();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) redirect("/admin/users");

  // Get email
  const { data: userData } = await supabase.auth.admin.getUserById(id);

  // Get recent food logs
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("id, food_name, protein_g, calories, portion_g, logged_at, log_date, meal_type")
    .eq("user_id", id)
    .order("logged_at", { ascending: false })
    .limit(20);

  // Get recent workout logs
  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("id, workout_day, week_key, completed_at")
    .eq("user_id", id)
    .order("completed_at", { ascending: false })
    .limit(20);

  // Get recent medication logs
  const { data: medicationLogs } = await supabase
    .from("medication_logs")
    .select("id, medication, dose_mg, change_date, change_type, appetite_level, notes, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get activity log (profile updates)
  const { data: activityLogs } = await supabase
    .from("user_activity_log")
    .select("id, action, changed_fields, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  // Get Stripe payment history
  let payments: { amount: number; currency: string; date: string; status: string }[] = [];
  if (profile.stripe_customer_id) {
    try {
      const invoices = await getStripe().invoices.list({
        customer: profile.stripe_customer_id,
        limit: 30,
      });
      payments = invoices.data.map((inv) => ({
        amount: (inv.amount_paid ?? 0) / 100,
        currency: inv.currency ?? "usd",
        date: new Date((inv.created ?? 0) * 1000).toISOString(),
        status: inv.status ?? "unknown",
      }));
    } catch (err) {
      console.error("Stripe payment fetch error:", err);
    }
  }

  const user = {
    ...profile,
    email: userData.user?.email ?? "",
    auth_created_at: userData.user?.created_at ?? null,
  };

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav email={session.email} role={session.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <UserDetailClient
          user={user}
          foodLogs={foodLogs ?? []}
          workoutLogs={workoutLogs ?? []}
          medicationLogs={medicationLogs ?? []}
          activityLogs={activityLogs ?? []}
          payments={payments}
          isSuperAdmin={session.role === "super_admin"}
        />
      </div>
    </div>
  );
}
