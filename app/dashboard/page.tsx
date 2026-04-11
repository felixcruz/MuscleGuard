export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Monday of current week
  const todayDate = new Date(today + "T12:00:00Z");
  const day = todayDate.getDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() + toMonday);
  const weekStart = monday.toISOString().split("T")[0];

  const [profileResult, logsResult, weekLogsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("protein_goal_g, weight_kg, protein_streak_days, protein_streak_last_date, workout_streak_days, total_points")
      .eq("id", user.id)
      .single(),
    supabase
      .from("food_logs")
      .select("id, food_name, protein_g, calories, portion_g, logged_at")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .order("logged_at", { ascending: true }),
    supabase
      .from("food_logs")
      .select("id, food_name, protein_g, log_date, logged_at")
      .eq("user_id", user.id)
      .gte("log_date", weekStart)
      .lte("log_date", today)
      .order("logged_at", { ascending: true }),
  ]);

  const profile = profileResult.data;

  return (
    <DashboardClient
      userId={user.id}
      proteinGoalG={profile?.protein_goal_g ?? 120}
      initialLogs={logsResult.data ?? []}
      weekLogs={weekLogsResult.data ?? []}
      weekStart={weekStart}
      proteinStreakDays={profile?.protein_streak_days ?? 0}
      workoutStreakDays={profile?.workout_streak_days ?? 0}
      totalPoints={profile?.total_points ?? 0}
      goalAlreadyHitToday={profile?.protein_streak_last_date === today}
    />
  );
}
