// Internal activity report emailed to the team every other day. Pure helpers
// only (no I/O) so they can be unit tested; the cron route gathers the data.
// Never put health data (weight, doses, meals) in this report: counts only.

export const REPORT_WINDOW_HOURS = 48;
export const REPORT_RECIPIENT = "hello@stoovaapp.com";
const TIME_ZONE = "America/Santo_Domingo";

/** Minimal shape of the Stripe events we read (keeps this file Stripe-free). */
export interface StripeEventLike {
  type: string;
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
}

export interface CustomerEvent {
  customerId: string | null;
  email: string | null;
  at: number;
}

export interface StripeSummary {
  trialsStarted: CustomerEvent[];
  paidSignups: CustomerEvent[];
  trialsConverted: CustomerEvent[];
  cancellationsScheduled: CustomerEvent[];
  reactivations: CustomerEvent[];
  subscriptionsEnded: CustomerEvent[];
  paymentsFailed: CustomerEvent[];
  revenueCents: number;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function customerOf(obj: Record<string, unknown>): string | null {
  const c = obj.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "id" in c) return str((c as { id: unknown }).id);
  return null;
}

function emailOf(obj: Record<string, unknown>): string | null {
  const details = obj.customer_details as { email?: unknown } | undefined;
  return str(obj.customer_email) ?? str(details?.email);
}

export function summarizeStripeEvents(events: StripeEventLike[]): StripeSummary {
  const s: StripeSummary = {
    trialsStarted: [],
    paidSignups: [],
    trialsConverted: [],
    cancellationsScheduled: [],
    reactivations: [],
    subscriptionsEnded: [],
    paymentsFailed: [],
    revenueCents: 0,
  };

  for (const e of events) {
    const obj = e.data.object;
    const prev = e.data.previous_attributes ?? {};
    const ev: CustomerEvent = { customerId: customerOf(obj), email: emailOf(obj), at: e.created };

    switch (e.type) {
      case "checkout.session.completed":
        if (obj.mode !== "subscription") break;
        // A trial checkout charges nothing up front.
        if ((obj.amount_total as number | null) === 0) s.trialsStarted.push(ev);
        else s.paidSignups.push(ev);
        break;
      case "customer.subscription.updated":
        if (prev.status === "trialing" && obj.status === "active") s.trialsConverted.push(ev);
        if (prev.cancel_at_period_end === false && obj.cancel_at_period_end === true)
          s.cancellationsScheduled.push(ev);
        if (prev.cancel_at_period_end === true && obj.cancel_at_period_end === false)
          s.reactivations.push(ev);
        break;
      case "customer.subscription.deleted":
        s.subscriptionsEnded.push(ev);
        break;
      case "invoice.payment_failed":
        s.paymentsFailed.push(ev);
        break;
      case "invoice.paid":
        s.revenueCents += (obj.amount_paid as number | null) ?? 0;
        break;
    }
  }
  return s;
}

/** Normalizes a recurring price to a monthly amount in cents. */
export function monthlyCents(unitAmount: number, quantity: number, interval: string, intervalCount = 1): number {
  const total = unitAmount * quantity;
  switch (interval) {
    case "year":
      return total / (12 * intervalCount);
    case "week":
      return (total * 52) / (12 * intervalCount);
    case "day":
      return (total * 365) / (12 * intervalCount);
    default:
      return total / intervalCount;
  }
}

export interface ActivityReport {
  since: Date;
  until: Date;
  signups: { total: number; onboarded: number };
  allTime: { users: number; onboarded: number; everSubscribed: number };
  statusCounts: Record<string, number>;
  stripe: StripeSummary;
  money: { mrrCents: number; activeSubs: number; trialing: number; trialsEndingSoon: number; currency: string };
  usage: {
    activeUsers: number;
    foodLogs: number;
    foodLoggers: number;
    workouts: number;
    workoutUsers: number;
    measurements: number;
    medicationChanges: number;
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function fmtDate(d: Date): string {
  return d.toLocaleString("es-DO", { timeZone: TIME_ZONE, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function pct(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : "—";
}

const ROW = 'style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08)"';

function section(title: string, rows: [string, string | number][]): string {
  const trs = rows
    .map(([k, v]) => `<tr><td ${ROW}>${k}</td><td ${ROW} align="right"><strong style="color:#ffffff">${v}</strong></td></tr>`)
    .join("");
  return `<p style="margin:24px 0 8px;color:#CDFF00;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.05em">${title}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${trs}</table>`;
}

function people(title: string, list: CustomerEvent[]): string {
  if (!list.length) return "";
  const items = list
    .map((e) => `<li>${escapeHtml(e.email ?? e.customerId ?? "desconocido")} · ${fmtDate(new Date(e.at * 1000))}</li>`)
    .join("");
  return `<p style="margin:16px 0 4px;color:#ffffff;font-weight:600">${title}</p><ul style="margin:0;padding-left:18px">${items}</ul>`;
}

export function renderActivityReport(r: ActivityReport): { subject: string; body: string } {
  const s = r.stripe;
  const newCustomers = s.trialsStarted.length + s.paidSignups.length;
  const losses = s.subscriptionsEnded.length + s.cancellationsScheduled.length;
  const subject = `Stoova · ${r.signups.total} registros, ${newCustomers} altas, ${losses} bajas (últimas ${REPORT_WINDOW_HOURS}h)`;

  const st = r.statusCounts;
  const body = `<p style="margin:0 0 4px">Del ${fmtDate(r.since)} al ${fmtDate(r.until)} (hora RD).</p>
${section("Altas y bajas", [
    ["Nuevos registros", r.signups.total],
    ["Pruebas gratis iniciadas", s.trialsStarted.length],
    ["Suscripciones pagadas directas", s.paidSignups.length],
    ["Pruebas que pasaron a pago", s.trialsConverted.length],
    ["Cancelaciones programadas", s.cancellationsScheduled.length],
    ["Suscripciones terminadas", s.subscriptionsEnded.length],
    ["Reactivaciones", s.reactivations.length],
    ["Pagos fallidos", s.paymentsFailed.length],
  ])}
${people("Cancelaron (para dar seguimiento)", [...s.cancellationsScheduled, ...s.subscriptionsEnded])}
${people("Pago fallido (revisar)", s.paymentsFailed)}
${section("Onboarding", [
    ["Registros nuevos que terminaron onboarding", `${r.signups.onboarded} de ${r.signups.total} (${pct(r.signups.onboarded, r.signups.total)})`],
    ["Total histórico: registrados", r.allTime.users],
    ["Total histórico: terminaron onboarding", `${r.allTime.onboarded} (${pct(r.allTime.onboarded, r.allTime.users)})`],
    ["Total histórico: alguna vez suscritos", `${r.allTime.everSubscribed} (${pct(r.allTime.everSubscribed, r.allTime.users)})`],
  ])}
${section("Uso de la app", [
    ["Usuarios que abrieron la app", r.usage.activeUsers],
    ["Comidas registradas", `${r.usage.foodLogs} (${r.usage.foodLoggers} usuarios)`],
    ["Entrenamientos completados", `${r.usage.workouts} (${r.usage.workoutUsers} usuarios)`],
    ["Mediciones corporales", r.usage.measurements],
    ["Cambios de medicamento", r.usage.medicationChanges],
  ])}
${section("Dinero", [
    ["Cobrado en el periodo", money(s.revenueCents, r.money.currency)],
    ["MRR (ingreso mensual recurrente)", money(r.money.mrrCents, r.money.currency)],
    ["Suscriptores pagando", r.money.activeSubs],
    ["En prueba gratis", r.money.trialing],
    [`Pruebas que vencen en ${REPORT_WINDOW_HOURS}h`, r.money.trialsEndingSoon],
  ])}
${section("Estado actual de cuentas", [
    ["Activas", st.active ?? 0],
    ["En prueba", st.trialing ?? 0],
    ["Pago atrasado", st.past_due ?? 0],
    ["Canceladas", st.cancelled ?? 0],
    ["Sin suscripción", st.none ?? 0],
  ])}`;

  return { subject, body };
}
