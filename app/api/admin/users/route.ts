import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all users from auth first (source of truth)
  const { data: authData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, subscription_status, protein_goal_g, workout_streak_days, onboarding_done, glp1_medication, glp1_dose_mg"
    );

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  const profileMap = new Map<string, (typeof profiles extends (infer T)[] | null ? T : never)>();
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p);
  }

  const users = (authData?.users ?? []).map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      name: p?.full_name ?? "",
      role: p?.role ?? "user",
      subscription_status: p?.subscription_status ?? "none",
      protein_goal_g: p?.protein_goal_g ?? 0,
      workout_streak_days: p?.workout_streak_days ?? 0,
      onboarding_done: p?.onboarding_done ?? false,
      medication: p?.glp1_medication ?? null,
      dose_mg: p?.glp1_dose_mg ?? null,
      created_at: u.created_at,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ users });
}
