export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainingClient } from "./TrainingClient";

// Monday-anchored week key: "mg-w-2026-04-07"
function getWeekKey(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + toMonday);
  const ymd = monday.toISOString().split("T")[0];
  return `mg-w-${ymd}`;
}

export default async function TrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const weekKey = getWeekKey();

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("workout_streak_days, protein_streak_days, total_points")
      .eq("id", user.id)
      .single(),
    supabase
      .from("workout_logs")
      .select("workout_day")
      .eq("user_id", user.id)
      .eq("week_key", weekKey),
  ]);

  return (
    <TrainingClient
      weekKey={weekKey}
      initialDone={logsResult.data?.map(l => l.workout_day) ?? []}
      workoutStreakDays={profileResult.data?.workout_streak_days ?? 0}
      proteinStreakDays={profileResult.data?.protein_streak_days ?? 0}
      totalPoints={profileResult.data?.total_points ?? 0}
    />
  );
}
