import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  
  // TEMPORARY BYPASS FOR TESTING
  if (!user) {
    user = { id: '2388e5b4-adbf-4be8-922d-219254d70b0a' } as any;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("protein_target_g, current_weight_kg")
    .eq("id", user.id)
    .single();

  // Today's food logs
  const today = new Date().toISOString().split("T")[0];
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .order("logged_at", { ascending: true });

  return (
    <DashboardClient
      userId={user.id}
      proteinGoalG={profile?.protein_target_g ?? 120}
      initialLogs={foodLogs ?? []}
    />
  );
}