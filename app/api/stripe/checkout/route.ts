import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Plan selection: "annual" uses the discounted yearly price, anything else
    // falls back to the monthly price (keeps older callers working).
    let plan: "monthly" | "annual" = "monthly";
    try {
      const body = await request.json();
      if (body?.plan === "annual") plan = "annual";
    } catch {
      // no body → monthly
    }

    const priceId =
      plan === "annual"
        ? process.env.STRIPE_PRICE_ID_ANNUAL
        : process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Selected plan is not available yet. Please try another plan." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "User profile not found. Please complete onboarding." },
        { status: 400 }
      );
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      try {
        const customer = await getStripe().customers.create({
          email: user.email,
          metadata: { supabase_uid: user.id },
        });
        customerId = customer.id;

        // stripe_customer_id is a privileged column locked by the DB trigger
        // (016_security_hardening), so it must be written with the service role,
        // not the user's own session.
        const { error: updateError } = await createAdminClient()
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);

        if (updateError) throw updateError;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create billing account";
        return NextResponse.json(
          { error: message },
          { status: 500 }
        );
      }
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/dashboard?trial_started=1`,
      cancel_url: `${SITE_URL}/checkout`,
      metadata: { supabase_uid: user.id, plan },
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_uid: user.id, plan },
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
