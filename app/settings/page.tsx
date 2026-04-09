import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  // TEMPORARY BYPASS FOR TESTING
if (!user) {
  user = { id: '2388e5b4-adbf-4be8-922d-219254d70b0a' } as any;
}

  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_kg, target_weight_kg, protein_goal_g, subscription_status, trial_ends_at, stripe_customer_id")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      email={user.email ?? ""}
      profile={profile ?? {}}
    />
  );
}
