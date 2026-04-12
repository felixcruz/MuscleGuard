import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateProteinGoal,
  calculateTrainingIntensityPct,
  getNextDueDate,
  type Goal,
  type AppetiteLevel,
} from "@/lib/personalization";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { dose_mg, change_type, appetite_level, energy_level, notes } = body;

  if (!dose_mg || !change_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validChangeTypes = ["increase", "decrease", "switch", "pause", "start"];
  if (!validChangeTypes.includes(change_type)) {
    return NextResponse.json({ error: "Invalid change type" }, { status: 400 });
  }

  if (typeof dose_mg !== "number" || dose_mg <= 0 || dose_mg > 100) {
    return NextResponse.json({ error: "Invalid dose" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "glp1_medication, glp1_dose_mg, weight_kg, primary_goal, glp1_frequency"
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const weightKg = profile.weight_kg ?? 80;
  const goal = (profile.primary_goal ?? "preserve_muscle") as Goal;
  const newDoseMg = Number(dose_mg);
  const newAppetite = (appetite_level ?? "moderate") as AppetiteLevel;

  // Compute new protein goal and intensity
  const newProteinGoal = calculateProteinGoal(weightKg, goal, newDoseMg);
  const newIntensityPct = calculateTrainingIntensityPct(newDoseMg, newAppetite);

  // Insert medication log
  await supabase.from("medication_logs").insert({
    user_id: user.id,
    medication: profile.glp1_medication,
    dose_mg: newDoseMg,
    previous_dose_mg: profile.glp1_dose_mg,
    change_type,
    change_date: today,
    appetite_level: appetite_level || null,
    energy_level: energy_level || null,
    notes: notes || null,
  });

  // Update profile
  await supabase
    .from("profiles")
    .update({
      glp1_dose_mg: newDoseMg,
      glp1_last_dose_date: today,
      appetite_level: appetite_level || null,
      protein_goal_g: newProteinGoal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Compute next due date
  const nextDueDateObj = getNextDueDate(today, profile.glp1_frequency ?? "weekly");
  const nextDueDate = nextDueDateObj
    ? nextDueDateObj.toISOString().split("T")[0]
    : null;

  return NextResponse.json({
    ok: true,
    newProteinGoal,
    newIntensityPct,
    nextDueDate,
  });
}
