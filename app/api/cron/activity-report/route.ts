import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/resend";
import { brandedEmail } from "@/lib/email-template";
import { getAdminSession } from "@/lib/admin-session";
import {
  REPORT_RECIPIENT,
  REPORT_WINDOW_HOURS,
  summarizeStripeEvents,
  monthlyCents,
  renderActivityReport,
  type CustomerEvent,
} from "@/lib/activity-report";

export const maxDuration = 60;

const STRIPE_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.paid",
];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }
  return mismatch === 0;
}

/**
 * Internal activity report for the team, every other day (see vercel.json).
 * Vercel Cron calls it with CRON_SECRET; a logged-in admin can also open it in
 * the browser to send the report right away and see a preview.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCron = !!cronSecret && !!authHeader && timingSafeEqual(authHeader, `Bearer ${cronSecret}`);
  if (!isCron && !(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const until = new Date();
  const since = new Date(until.getTime() - REPORT_WINDOW_HOURS * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
  const sinceUnix = Math.floor(since.getTime() / 1000);
  const admin = createAdminClient();
  const stripe = getStripe();

  // --- Users and onboarding (Supabase) ---
  const newUserIds: string[] = [];
  let totalUsers = 0;
  for (let page = 1; ; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const users = data?.users ?? [];
    totalUsers += users.length;
    for (const u of users) if (u.created_at >= sinceIso) newUserIds.push(u.id);
    if (users.length < 1000) break;
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, onboarding_done, subscription_status, stripe_subscription_id");
  const statusCounts: Record<string, number> = {};
  let onboardedAll = 0;
  let everSubscribed = 0;
  const onboardedById = new Map<string, boolean>();
  for (const p of profiles ?? []) {
    const status = p.subscription_status ?? "none";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    if (p.onboarding_done) onboardedAll++;
    if (p.stripe_subscription_id) everSubscribed++;
    onboardedById.set(p.id, !!p.onboarding_done);
  }
  const newOnboarded = newUserIds.filter((id) => onboardedById.get(id)).length;

  // --- Usage (Supabase). Counts only: no health values leave the database. ---
  const distinct = (rows: { user_id: string }[] | null) => new Set((rows ?? []).map((r) => r.user_id)).size;
  const [opened, food, workouts, measurements, meds] = await Promise.all([
    admin.from("user_activity_log").select("user_id").eq("action", "app_opened").gte("created_at", sinceIso),
    admin.from("food_logs").select("user_id").gte("logged_at", sinceIso),
    admin.from("workout_logs").select("user_id").gte("completed_at", sinceIso),
    admin.from("body_measurements").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
    admin.from("medication_logs").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
  ]);

  // --- Subscriptions and money (Stripe) ---
  const events: Stripe.Event[] = [];
  for await (const e of stripe.events.list({ created: { gte: sinceUnix }, types: STRIPE_EVENT_TYPES, limit: 100 })) {
    events.push(e);
  }
  const summary = summarizeStripeEvents(events as unknown as Parameters<typeof summarizeStripeEvents>[0]);

  let mrrCents = 0;
  let activeSubs = 0;
  let currency = "usd";
  for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100 })) {
    activeSubs++;
    for (const item of sub.items.data) {
      const price = item.price;
      if (!price.recurring || price.unit_amount == null) continue;
      currency = price.currency;
      mrrCents += monthlyCents(price.unit_amount, item.quantity ?? 1, price.recurring.interval, price.recurring.interval_count);
    }
  }
  let trialing = 0;
  let trialsEndingSoon = 0;
  const soon = Math.floor(until.getTime() / 1000) + REPORT_WINDOW_HOURS * 60 * 60;
  for await (const sub of stripe.subscriptions.list({ status: "trialing", limit: 100 })) {
    trialing++;
    if (sub.trial_end && sub.trial_end <= soon) trialsEndingSoon++;
  }

  // Fill in emails for the people the team may want to contact.
  const needEmail: CustomerEvent[] = [
    ...summary.cancellationsScheduled,
    ...summary.subscriptionsEnded,
    ...summary.paymentsFailed,
  ].filter((e) => !e.email && e.customerId);
  const emailByCustomer = new Map<string, string | null>();
  for (const e of needEmail) {
    const id = e.customerId!;
    if (!emailByCustomer.has(id)) {
      const c = await stripe.customers.retrieve(id).catch(() => null);
      emailByCustomer.set(id, c && !c.deleted ? c.email : null);
    }
    e.email = emailByCustomer.get(id) ?? null;
  }

  const { subject, body } = renderActivityReport({
    since,
    until,
    signups: { total: newUserIds.length, onboarded: newOnboarded },
    allTime: { users: totalUsers, onboarded: onboardedAll, everSubscribed },
    statusCounts,
    stripe: summary,
    money: { mrrCents, activeSubs, trialing, trialsEndingSoon, currency },
    usage: {
      activeUsers: distinct(opened.data),
      foodLogs: food.data?.length ?? 0,
      foodLoggers: distinct(food.data),
      workouts: workouts.data?.length ?? 0,
      workoutUsers: distinct(workouts.data),
      measurements: measurements.count ?? 0,
      medicationChanges: meds.count ?? 0,
    },
  });
  const html = brandedEmail({ title: "Reporte de actividad", body });
  await sendEmail(REPORT_RECIPIENT, subject, html);

  if (isCron) return NextResponse.json({ sent: true, subject });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
