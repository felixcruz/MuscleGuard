export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MealsClient } from "./MealsClient";
import {
  calculateProteinGoal,
  proteinMealBreakdown,
  type Goal,
} from "@/lib/personalization";

export default async function MealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];
  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "protein_goal_g, dietary_prefs, best_appetite_time, primary_goal, glp1_dose_mg, glp1_medication, weight_kg"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("food_logs")
      .select("protein_g")
      .eq("user_id", user.id)
      .eq("log_date", today),
  ]);

  const profile = profileResult.data;
  const weightKg = profile?.weight_kg ?? 80;
  const goal = (profile?.primary_goal ?? "preserve_muscle") as Goal;
  const doseMg = profile?.glp1_dose_mg ?? 1.0;
  const bestAppetiteTime = profile?.best_appetite_time ?? "midday";

  const proteinGoal =
    profile?.protein_goal_g ??
    calculateProteinGoal(weightKg, goal, doseMg);
  const proteinBreakdown = proteinMealBreakdown(proteinGoal, bestAppetiteTime);

  const loggedG = (logsResult.data ?? []).reduce(
    (sum, l) => sum + Number(l.protein_g),
    0
  );

  return (
    <MealsClient
      userId={user.id}
      proteinGoalG={proteinGoal}
      proteinLoggedG={loggedG}
      dietaryPrefs={profile?.dietary_prefs ?? []}
      proteinBreakdown={proteinBreakdown}
    />
  );
}
