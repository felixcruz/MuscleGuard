export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentWeekBounds,
  getLastCompletedWeekBounds,
  type WeeklyReportData,
} from "@/lib/weekly-report";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { weekStart: currStart, weekEnd: currEnd } = getCurrentWeekBounds();
  const { weekStart: lastStart, weekEnd: lastEnd } = getLastCompletedWeekBounds();

  const today = new Date().toISOString().split("T")[0];
  const isSunday = new Date().getDay() === 0;

  const [reportsResult, foodLogsResult, workoutLogsResult, lastWeekReportResult, profileResult] =
    await Promise.all([
      // Past reports (most recent first, limit 12)
      supabase
        .from("weekly_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(12),

      // Current week food logs for partial progress
      supabase
        .from("food_logs")
        .select("log_date, protein_g")
        .eq("user_id", user.id)
        .gte("log_date", currStart)
        .lte("log_date", today),

      // Current week workouts
      supabase
        .from("workout_logs")
        .select("workout_day")
        .eq("user_id", user.id)
        .gte("completed_at", `${currStart}T00:00:00Z`)
        .lte("completed_at", `${today}T23:59:59Z`),

      // Check if last completed week already has a report
      supabase
        .from("weekly_reports")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start", lastStart)
        .maybeSingle(),

      supabase
        .from("profiles")
        .select("protein_goal_g")
        .eq("id", user.id)
        .single(),
    ]);

  const proteinGoalG = Math.round(profileResult.data?.protein_goal_g ?? 120);

  // Aggregate protein by day for current week
  const byDay: Record<string, number> = {};
  for (const log of foodLogsResult.data ?? []) {
    byDay[log.log_date] = (byDay[log.log_date] ?? 0) + Number(log.protein_g ?? 0);
  }
  const currentWeekProteinDays = Object.values(byDay).filter(
    (p) => p >= proteinGoalG * 0.8
  ).length;
  const currentWeekTotalProtein = Math.round(
    Object.values(byDay).reduce((a, b) => a + b, 0)
  );
  const currentWeekWorkouts = workoutLogsResult.data?.length ?? 0;

  // Days elapsed in current week (Mon=1 … Sun=7, min 1)
  const monday = new Date(currStart + "T12:00:00Z");
  const todayDate = new Date(today + "T12:00:00Z");
  const daysElapsed = Math.max(
    1,
    Math.floor((todayDate.getTime() - monday.getTime()) / 86400000) + 1
  );

  return (
    <ReportsClient
      userId={user.id}
      reports={(reportsResult.data ?? []) as WeeklyReportData[]}
      proteinGoalG={proteinGoalG}
      currentWeek={{
        weekStart: currStart,
        weekEnd: currEnd,
        proteinDaysHit: currentWeekProteinDays,
        daysElapsed,
        workoutsCount: currentWeekWorkouts,
        totalProteinG: currentWeekTotalProtein,
      }}
      lastWeekReportExists={!!lastWeekReportResult.data}
      lastWeekStart={lastStart}
      lastWeekEnd={lastEnd}
      isSunday={isSunday}
    />
  );
}
