import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, subscription_status, protein_goal_g, workout_streak_days, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  // Get emails from auth
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

  return NextResponse.json({ users });
}
