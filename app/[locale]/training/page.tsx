export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainingClient } from "./TrainingClient";
import { calculateTrainingIntensityPct, type AppetiteLevel } from "@/lib/personalization";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const weekKey = getWeekKey();

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "workout_streak_days, protein_streak_days, total_points, glp1_dose_mg, appetite_level, experience_level, activity_types, primary_activity, equipment, comm_style"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("workout_logs")
      .select("workout_day")
      .eq("user_id", user.id)
      .eq("week_key", weekKey),
  ]);

  const profile = profileResult.data;
  const doseMg = profile?.glp1_dose_mg ?? 1.0;
  const appetiteLevel = (profile?.appetite_level ?? "moderate") as AppetiteLevel;
  const intensityPct = calculateTrainingIntensityPct(doseMg, appetiteLevel);

  return (
    <TrainingClient
      weekKey={weekKey}
      initialDone={logsResult.data?.map((l) => l.workout_day) ?? []}
      workoutStreakDays={profile?.workout_streak_days ?? 0}
      proteinStreakDays={profile?.protein_streak_days ?? 0}
      totalPoints={profile?.total_points ?? 0}
      intensityPct={intensityPct}
      activityTypes={profile?.activity_types ?? ["strength"]}
      primaryActivity={profile?.primary_activity ?? "strength"}
      experienceLevel={profile?.experience_level ?? "beginner"}
      equipment={profile?.equipment ?? "bodyweight"}
      commStyle={profile?.comm_style ?? "balanced"}
    />
  );
}
