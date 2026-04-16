export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MedicationClient } from "./MedicationClient";
import {
  calculateProteinGoal,
  calculateTrainingIntensityPct,
  getNextDueDate,
  getMedicationStatus,
  type Goal,
  type AppetiteLevel,
} from "@/lib/personalization";

export default async function MedicationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "glp1_medication, glp1_dose_mg, glp1_frequency, glp1_injection_day, glp1_last_dose_date, weight_kg, primary_goal, appetite_level, protein_goal_g"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("medication_logs")
      .select(
        "id, medication, dose_mg, change_date, change_type, previous_dose_mg, appetite_level, notes, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profile = profileResult.data;
  const medication = profile?.glp1_medication ?? "semaglutide";
  const doseMg = profile?.glp1_dose_mg ?? 1.0;
  const frequency = profile?.glp1_frequency ?? "weekly";
  const injectionDay = profile?.glp1_injection_day ?? null;
  const lastDoseDate = profile?.glp1_last_dose_date ?? null;
  const weightKg = profile?.weight_kg ?? 80;
  const goal = (profile?.primary_goal ?? "preserve_muscle") as Goal;
  const appetiteLevel = (profile?.appetite_level ?? "moderate") as AppetiteLevel;

  const nextDueDateObj = getNextDueDate(lastDoseDate, frequency);
  const statusInfo = getMedicationStatus(nextDueDateObj);

  const proteinGoal =
    profile?.protein_goal_g ?? calculateProteinGoal(weightKg, goal, doseMg);
  const intensityPct = calculateTrainingIntensityPct(doseMg, appetiteLevel);

  return (
    <MedicationClient
      userId={user.id}
      medication={medication}
      doseMg={doseMg}
      frequency={frequency}
      injectionDay={injectionDay}
      lastDoseDate={lastDoseDate}
      nextDueDate={nextDueDateObj ? nextDueDateObj.toISOString().split("T")[0] : null}
      status={statusInfo.status}
      statusLabel={statusInfo.label}
      statusColorClass={statusInfo.colorClass}
      daysUntil={statusInfo.daysUntil}
      logs={logsResult.data ?? []}
      currentProteinGoal={proteinGoal}
      currentIntensityPct={intensityPct}
    />
  );
}
