import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MealsClient } from "./MealsClient";

export default async function MealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protected by middleware - user should always exist
  if (!user) {
    return redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];
  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("protein_target_g, dietary_prefs")
      .eq("id", user.id)
      .single(),
    supabase
      .from("food_logs")
      .select("protein_g")
      .eq("user_id", user.id)
      .eq("log_date", today),
  ]);

  const proteinGoal = profileResult.data?.protein_target_g ?? 120;
  const loggedG = (logsResult.data ?? []).reduce(
    (sum, l) => sum + Number(l.protein_g),
    0
  );

  return (
    <MealsClient
      userId={user.id}
      proteinRemainingG={Math.max(0, proteinGoal - loggedG)}
      dietaryPrefs={profileResult.data?.dietary_prefs ?? []}
    />
  );
}