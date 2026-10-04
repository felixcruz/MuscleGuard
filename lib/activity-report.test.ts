import { test } from "node:test";
import assert from "node:assert";
import {
  summarizeStripeEvents,
  monthlyCents,
  renderActivityReport,
  type StripeEventLike,
  type ActivityReport,
} from "./activity-report.ts";

const ev = (type: string, object: Record<string, unknown>, previous_attributes?: Record<string, unknown>): StripeEventLike => ({
  type,
  created: 1_790_000_000,
  data: { object, previous_attributes },
});

test("classifies subscription lifecycle events", () => {
  const s = summarizeStripeEvents([
    ev("checkout.session.completed", { mode: "subscription", amount_total: 0, customer: "cus_trial", customer_details: { email: "t@x.com" } }),
    ev("checkout.session.completed", { mode: "subscription", amount_total: 999, customer: "cus_paid" }),
    ev("checkout.session.completed", { mode: "payment", amount_total: 500, customer: "cus_other" }),
    ev("customer.subscription.updated", { status: "active", customer: "cus_a" }, { status: "trialing" }),
    ev("customer.subscription.updated", { status: "active", cancel_at_period_end: true, customer: "cus_b" }, { cancel_at_period_end: false }),
    ev("customer.subscription.updated", { status: "active", cancel_at_period_end: false, customer: "cus_c" }, { cancel_at_period_end: true }),
    ev("customer.subscription.updated", { status: "active", customer: "cus_d" }, { items: {} }),
    ev("customer.subscription.deleted", { customer: "cus_e" }),
    ev("invoice.payment_failed", { customer: "cus_f", customer_email: "f@x.com" }),
    ev("invoice.paid", { amount_paid: 999 }),
    ev("invoice.paid", { amount_paid: 0 }),
  ]);
  assert.equal(s.trialsStarted.length, 1);
  assert.equal(s.trialsStarted[0].email, "t@x.com");
  assert.equal(s.paidSignups.length, 1);
  assert.equal(s.trialsConverted.length, 1);
  assert.equal(s.cancellationsScheduled[0].customerId, "cus_b");
  assert.equal(s.reactivations[0].customerId, "cus_c");
  assert.equal(s.subscriptionsEnded.length, 1);
  assert.equal(s.paymentsFailed[0].email, "f@x.com");
  assert.equal(s.revenueCents, 999);
});

test("normalizes prices to monthly", () => {
  assert.equal(monthlyCents(999, 1, "month"), 999);
  assert.equal(monthlyCents(12000, 1, "year"), 1000);
  assert.equal(monthlyCents(1000, 2, "month", 2), 1000);
});

test("report escapes emails and never divides by zero", () => {
  const stripe = summarizeStripeEvents([
    ev("customer.subscription.deleted", { customer: "cus_x", customer_email: "<script>@x.com" }),
  ]);
  const r: ActivityReport = {
    since: new Date("2026-10-01T12:00:00Z"),
    until: new Date("2026-10-03T12:00:00Z"),
    signups: { total: 0, onboarded: 0 },
    allTime: { users: 0, onboarded: 0, everSubscribed: 0 },
    statusCounts: {},
    stripe,
    money: { mrrCents: 0, activeSubs: 0, trialing: 0, trialsEndingSoon: 0, currency: "usd" },
    usage: { activeUsers: 0, foodLogs: 0, foodLoggers: 0, workouts: 0, workoutUsers: 0, measurements: 0, medicationChanges: 0 },
  };
  const { subject, body } = renderActivityReport(r);
  assert.match(subject, /0 registros, 0 altas, 1 bajas/);
  assert.ok(!body.includes("<script>"));
  assert.ok(body.includes("&lt;script&gt;@x.com"));
  assert.ok(!body.includes("NaN"));
});
