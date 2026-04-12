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

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, subscription_status, protein_goal_g, workout_streak_days, created_at"
    )
    .order("created_at", { ascending: false });

  // Get emails
  const { data: authData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });

  const emailMap = new Map<string, string>();
  if (authData?.users) {
    for (const u of authData.users) {
      emailMap.set(u.id, u.email ?? "");
    }
  }

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? "",
    name: p.full_name ?? "",
    role: p.role ?? "user",
    subscription_status: p.subscription_status ?? "none",
    protein_goal_g: p.protein_goal_g ?? 0,
    workout_streak_days: p.workout_streak_days ?? 0,
    created_at: p.created_at,
  }));

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
