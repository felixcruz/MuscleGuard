import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role for webhook updates (bypasses RLS)
function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = adminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      // Card is on file. If trial, status = "trialing"; if no trial, status = "active".
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.supabase_uid;
      if (uid && session.subscription) {
        const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
        const status = sub.status === "trialing" ? "trialing" : "active";
        await supabase.from("profiles").update({
          subscription_status: status,
          stripe_subscription_id: session.subscription as string,
        }).eq("id", uid);
      }
      break;
    }
    case "customer.subscription.updated": {
      // Fires when trial ends (trialing → active or past_due) and on other state changes.
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.supabase_uid;
      if (uid) {
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "cancelled",
          unpaid: "past_due",
        };
        const status = statusMap[sub.status];
        if (status) {
          await supabase.from("profiles")
            .update({ subscription_status: status })
            .eq("id", uid);
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = await getStripe().subscriptions.retrieve(invoice.subscription as string);
      const uid = sub.metadata?.supabase_uid;
      if (uid) {
        await supabase.from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", uid);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.supabase_uid;
      if (uid) {
        await supabase.from("profiles")
          .update({ subscription_status: "cancelled" })
          .eq("id", uid);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
