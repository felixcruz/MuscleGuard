import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isMissingCustomerError } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 400 }
      );
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active billing account. Please subscribe first." },
        { status: 400 }
      );
    }

    let portalSession;
    try {
      portalSession = await getStripe().billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${SITE_URL}/settings`,
      });
    } catch (err) {
      if (!isMissingCustomerError(err)) throw err;
      // Stale ID (e.g. created with test keys). Clear it so checkout makes a
      // fresh customer; privileged column, so write with the service role.
      await createAdminClient()
        .from("profiles")
        .update({ stripe_customer_id: null, stripe_subscription_id: null })
        .eq("id", user.id);
      return NextResponse.json(
        { error: "No active billing account. Please subscribe first." },
        { status: 400 }
      );
    }

    if (!portalSession.url) {
      throw new Error("Failed to create billing portal session");
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open billing portal";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
