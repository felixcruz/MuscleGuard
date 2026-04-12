export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
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
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get recent workout logs
  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", id)
    .order("completed_at", { ascending: false })
    .limit(20);

  // Get recent medication logs
  const { data: medicationLogs } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", id)
    .order("taken_at", { ascending: false })
    .limit(20);

  const user = {
    ...profile,
    email: userData.user?.email ?? "",
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
          isSuperAdmin={session.role === "super_admin"}
        />
      </div>
    </div>
  );
}
