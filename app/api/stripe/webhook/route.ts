import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import Stripe from "stripe";
import { brandedEmail } from "@/lib/email-template";
import { sendEmail } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";

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
            .update({
              subscription_status: status,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              subscription_period_end: sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
            })
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
      // Subscription fully ended (period expired or immediate cancel)
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.supabase_uid;
      if (uid) {
        await supabase.from("profiles")
          .update({
            subscription_status: "cancelled",
            cancel_at_period_end: false,
            subscription_period_end: null,
          })
          .eq("id", uid);
      }
      break;
    }
    case "customer.subscription.trial_will_end": {
      // Reminder before the trial converts to a paid charge (card-network and
      // state auto-renewal requirement for free trials).
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.supabase_uid;
      if (uid) {
        const { data: userData } = await supabase.auth.admin.getUserById(uid);
        const email = userData?.user?.email;
        if (email) {
          const item = sub.items.data[0];
          const amount = ((item?.price.unit_amount ?? 0) / 100).toFixed(2);
          const interval = item?.price.recurring?.interval ?? "month";
          const dateStr = sub.trial_end
            ? new Date(sub.trial_end * 1000).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "soon";
          await sendEmail(
            email,
            "Your Stoova free trial is ending",
            brandedEmail({
              title: "Your free trial is ending",
              body: `<p style="margin:0 0 8px">Your 7-day free trial ends on <strong style="color:#ffffff">${dateStr}</strong>.</p>
<p style="margin:0">After that you'll be charged <strong style="color:#ffffff">$${amount}/${interval}</strong>. You can cancel anytime before then from your Settings.</p>`,
              ctaText: "Manage subscription",
              ctaUrl: `${SITE_URL}/settings`,
            })
          );
        }
      }
      break;
    }
    case "invoice.upcoming": {
      // Advance renewal reminder for the annual plan only.
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId);
        const uid = sub.metadata?.supabase_uid;
        if (sub.metadata?.plan === "annual" && uid) {
          const { data: userData } = await supabase.auth.admin.getUserById(uid);
          const email = userData?.user?.email;
          if (email) {
            const amount = ((invoice.amount_due ?? 0) / 100).toFixed(2);
            const renewTs = invoice.next_payment_attempt ?? invoice.period_end;
            const dateStr = renewTs
              ? new Date(renewTs * 1000).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "soon";
            await sendEmail(
              email,
              "Your Stoova annual plan renews soon",
              brandedEmail({
                title: "Your annual plan renews soon",
                body: `<p style="margin:0 0 8px">Your Stoova annual plan will renew on <strong style="color:#ffffff">${dateStr}</strong>.</p>
<p style="margin:0">You'll be charged <strong style="color:#ffffff">$${amount}/year</strong>. You can cancel anytime before then from your Settings.</p>`,
                ctaText: "Manage subscription",
                ctaUrl: `${SITE_URL}/settings`,
              })
            );
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
