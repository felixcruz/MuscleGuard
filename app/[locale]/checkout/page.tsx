export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutRedirect } from "./CheckoutRedirect";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, onboarding_done, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // If already has active subscription, go to dashboard
  if (profile && ["active", "trialing"].includes(profile.subscription_status)) {
    return redirect("/dashboard");
  }

  // If onboarding not done, go to onboarding
  if (profile && !profile.onboarding_done) {
    return redirect("/onboarding");
  }

  return <CheckoutRedirect />;
}
