import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressPage() {
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  // TEMPORARY BYPASS FOR TESTING
if (!user) {
  user = { id: '2388e5b4-adbf-4be8-922d-219254d70b0a' } as any;
}

  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("measured_at, weight_kg, muscle_mass_kg, body_fat_pct")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: true })
    .limit(60);

  return <ProgressClient userId={user.id} initialMeasurements={measurements ?? []} />;
}
