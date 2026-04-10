import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainingClient } from "./TrainingClient";

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `mg-training-week-${now.getFullYear()}-${week}`;
}

export default async function TrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const weekKey = getWeekKey();

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("workout_streak_days, total_points")
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
      totalPoints={profileResult.data?.total_points ?? 0}
    />
  );
}
