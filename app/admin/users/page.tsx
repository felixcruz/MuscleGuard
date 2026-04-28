export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import UsersTableClient from "./UsersTableClient";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = createAdminClient();

  // Auth users are source of truth
  const { data: authData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, subscription_status, protein_goal_g, workout_streak_days, onboarding_done, glp1_medication, glp1_dose_mg"
    );

  const profileMap = new Map<string, Record<string, unknown>>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id as string, p);
  }

  // Only show users who have a profile (verified users, not typos)
  const users = (authData?.users ?? [])
    .filter((u) => profileMap.has(u.id))
    .map((u) => {
      const p = profileMap.get(u.id)!;
      return {
        id: u.id,
        email: u.email ?? "",
        name: (p.full_name as string) ?? "",
        role: (p.role as string) ?? "user",
        subscription_status: (p.subscription_status as string) ?? "none",
        protein_goal_g: (p.protein_goal_g as number) ?? 0,
        workout_streak_days: (p.workout_streak_days as number) ?? 0,
        onboarding_done: (p.onboarding_done as boolean) ?? false,
        created_at: u.created_at,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav email={session.email} role={session.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-obsidian rounded-[14px] p-6 mb-6">
          <h1 className="text-lg font-medium text-white">
            Users ({users.length})
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Manage all registered users
          </p>
        </div>

        <UsersTableClient users={users} />
      </div>
    </div>
  );
}
