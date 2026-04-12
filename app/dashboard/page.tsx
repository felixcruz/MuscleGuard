export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import {
  calculateProteinGoal,
  proteinGoalExplanation,
  proteinMealBreakdown,
  calculateTrainingIntensityPct,
  type Goal,
  type AppetiteLevel,
} from "@/lib/personalization";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Monday of current week
  const todayDate = new Date(today + "T12:00:00Z");
  const day = todayDate.getDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() + toMonday);
  const weekStart = monday.toISOString().split("T")[0];

  // 30 days ago for recent foods
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [profileResult, logsResult, weekLogsResult, recentFoodsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "protein_goal_g, weight_kg, protein_streak_days, protein_streak_last_date, workout_streak_days, total_points, primary_goal, glp1_dose_mg, glp1_medication, appetite_level, best_appetite_time, activity_types, primary_activity, comm_style, dietary_prefs, favorite_proteins"
      )
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
    supabase
      .from("food_logs")
      .select("food_name, protein_g, calories, portion_g, logged_at")
      .eq("user_id", user.id)
      .gte("log_date", thirtyDaysAgoStr)
      .order("logged_at", { ascending: false })
      .limit(200),
  ]);

  const profile = profileResult.data;

  // Compute personalization data server-side
  const weightKg = profile?.weight_kg ?? 80;
  const goal = (profile?.primary_goal ?? "preserve_muscle") as Goal;
  const doseMg = profile?.glp1_dose_mg ?? 1.0;
  const medication = profile?.glp1_medication ?? "semaglutide";
  const appetiteLevel = (profile?.appetite_level ?? "moderate") as AppetiteLevel;
  const bestAppetiteTime = profile?.best_appetite_time ?? "midday";

  const proteinGoalG = profile?.protein_goal_g ?? calculateProteinGoal(weightKg, goal, doseMg);
  const explanation = proteinGoalExplanation(weightKg, goal, doseMg, medication);
  const breakdown = proteinMealBreakdown(proteinGoalG, bestAppetiteTime);
  const trainingIntensityPct = calculateTrainingIntensityPct(doseMg, appetiteLevel);

  return (
    <DashboardClient
      userId={user.id}
      proteinGoalG={proteinGoalG}
      initialLogs={logsResult.data ?? []}
      weekLogs={weekLogsResult.data ?? []}
      weekStart={weekStart}
      proteinStreakDays={profile?.protein_streak_days ?? 0}
      workoutStreakDays={profile?.workout_streak_days ?? 0}
      totalPoints={profile?.total_points ?? 0}
      goalAlreadyHitToday={profile?.protein_streak_last_date === today}
      proteinGoalExplanation={explanation}
      proteinBreakdown={breakdown}
      trainingIntensityPct={trainingIntensityPct}
      appetiteLevel={appetiteLevel}
      commStyle={profile?.comm_style ?? "balanced"}
      recentFoods={recentFoodsResult.data ?? []}
      dietaryPrefs={profile?.dietary_prefs ?? []}
      favoriteProteins={profile?.favorite_proteins ?? null}
    />
  );
}
