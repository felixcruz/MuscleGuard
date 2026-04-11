export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "./ProgressClient";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protected by middleware - user should always exist
  if (!user) {
    return redirect("/login");
  }

  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("measured_at, weight_kg, muscle_mass_kg, body_fat_pct")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: true })
    .limit(60);

  return <ProgressClient userId={user.id} initialMeasurements={measurements ?? []} />;
}
