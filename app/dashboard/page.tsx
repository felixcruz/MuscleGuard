import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("protein_target_g, current_weight_kg")
    .eq("id", userId)
    .single();

  const today = new Date().toISOString().split("T")[0];
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", today)
    .order("logged_at", { ascending: true });

  return (
    <DashboardClient
      userId={userId}
      proteinGoalG={profile?.protein_target_g ?? 120}
      initialLogs={foodLogs ?? []}
    />
  );
}