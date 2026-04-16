export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const [{ data: measurements }, { data: medicationLogs }] = await Promise.all([
    supabase
      .from("body_measurements")
      .select("id, measured_at, weight_kg, muscle_mass_kg, body_fat_pct")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: true })
      .limit(60),
    supabase
      .from("medication_logs")
      .select("id, dose_mg, change_date, change_type, created_at")
      .eq("user_id", user.id)
      .in("change_type", ["start", "increase", "decrease", "switch"])
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  return (
    <ProgressClient
      userId={user.id}
      initialMeasurements={measurements ?? []}
      medicationLogs={medicationLogs ?? []}
    />
  );
}
