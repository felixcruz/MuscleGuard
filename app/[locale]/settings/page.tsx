import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protected by middleware - user should always exist
  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_kg, target_weight_kg, protein_goal_g, subscription_status, trial_ends_at, stripe_customer_id, full_name, language, comm_style, dietary_prefs, favorite_proteins, gender, cancel_at_period_end, subscription_period_end")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      userId={user.id}
      email={user.email ?? ""}
      profile={profile ?? {}}
    />
  );
}
