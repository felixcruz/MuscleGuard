import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNextDueDate } from "@/lib/personalization";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch current profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("glp1_medication, glp1_dose_mg, glp1_frequency")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Update last dose date
  await supabase
    .from("profiles")
    .update({ glp1_last_dose_date: today, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  // Insert medication log
  await supabase.from("medication_logs").insert({
    user_id: user.id,
    medication: profile.glp1_medication,
    dose_mg: profile.glp1_dose_mg,
    change_type: "dose_taken",
    change_date: today,
  });

  // Compute next due date
  const nextDueDateObj = getNextDueDate(today, profile.glp1_frequency ?? "weekly");
  const nextDueDate = nextDueDateObj
    ? nextDueDateObj.toISOString().split("T")[0]
    : null;

  return NextResponse.json({ ok: true, nextDueDate });
}
