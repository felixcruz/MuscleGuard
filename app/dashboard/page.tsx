import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("protein_goal_g, weight_kg, protein_streak_days, protein_streak_last_date, workout_streak_days, total_points")
      .eq("id", user.id)
      .single(),
    supabase
      .from("food_logs")
      .select("id, food_name, protein_g, calories, portion_g")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .order("logged_at", { ascending: true }),
  ]);

  const profile = profileResult.data;

  return (
    <DashboardClient
      userId={user.id}
      proteinGoalG={profile?.protein_goal_g ?? 120}
      initialLogs={logsResult.data ?? []}
      proteinStreakDays={profile?.protein_streak_days ?? 0}
      workoutStreakDays={profile?.workout_streak_days ?? 0}
      totalPoints={profile?.total_points ?? 0}
      goalAlreadyHitToday={profile?.protein_streak_last_date === today}
    />
  );
}
