import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextDueDate } from "@/lib/personalization";
import { brandedEmail } from "@/lib/email-template";
import { signEmailAction, EMAIL_ACTION_TTL_MS } from "@/lib/email-token";
import { SITE_URL } from "@/lib/site";

/** Days after the due date when we send the single "did you pause?" check-in. */
const PAUSE_CHECK_IN_DAY = 7;

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Stoova <noreply@muscleguard.app>",
      to,
      subject,
      html,
    }),
  });
}

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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || !timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const appUrl = SITE_URL;

  interface ProfileRow {
    id: string;
    glp1_medication: string | null;
    glp1_dose_mg: number | null;
    glp1_frequency: string | null;
    glp1_last_dose_date: string | null;
  }

  // Fetch all onboarded users with medication data
  const { data: profilesRaw } = await admin
    .from("profiles")
    .select(
      "id, glp1_medication, glp1_dose_mg, glp1_frequency, glp1_last_dose_date"
    )
    .eq("onboarding_done", true)
    .not("glp1_frequency", "is", null)
    .not("glp1_last_dose_date", "is", null)
    .not("glp1_paused", "is", true);

  const profiles = (profilesRaw ?? []) as ProfileRow[];

  if (profiles.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // Fetch user emails via admin auth
  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const userEmailMap: Record<string, string> = {};
  for (const u of usersData?.users ?? []) {
    if (u.email) userEmailMap[u.id] = u.email;
  }

  let processed = 0;

  for (const profile of profiles) {
    const email = userEmailMap[profile.id];
    if (!email) continue;

    if (!profile.glp1_last_dose_date || !profile.glp1_frequency) continue;

    const nextDueDateObj = getNextDueDate(
      profile.glp1_last_dose_date,
      profile.glp1_frequency
    );
    if (!nextDueDateObj) continue;

    const nextDateMs = Date.UTC(
      nextDueDateObj.getUTCFullYear(),
      nextDueDateObj.getUTCMonth(),
      nextDueDateObj.getUTCDate()
    );
    const todayMs = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    const daysOverdue = Math.floor((todayMs - nextDateMs) / (1000 * 60 * 60 * 24));
    const doseMg = profile.glp1_dose_mg ?? 1.0;
    const medLabel =
      profile.glp1_medication === "semaglutide"
        ? "Semaglutide"
        : profile.glp1_medication === "tirzepatide"
        ? "Tirzepatide"
        : profile.glp1_medication ?? "GLP-1";

    // Exactly two emails per missed cycle: a soft nudge on the due date, and a
    // single check-in a week later. After day 7 we stay silent until the user
    // logs a dose again — repeating daily burns the sender reputation and the
    // user's patience.
    if (daysOverdue === 0) {
      // Due today — soft reminder
      await sendEmail(
        email,
        `Your ${doseMg}mg ${medLabel} dose is due today`,
        brandedEmail({
          title: "Your dose is due today",
          body: `<p style="margin:0 0 8px">Your <strong style="color:#ffffff">${doseMg}mg ${medLabel}</strong> dose is scheduled for today.</p>
<p style="margin:0">Log it in Stoova to keep your protein and training plan accurate.</p>`,
          ctaText: "Log dose taken",
          ctaUrl: `${appUrl}/medication`,
        })
      );
      processed++;
    } else if (daysOverdue === PAUSE_CHECK_IN_DAY) {
      // One week without a logged dose — ask instead of nagging
      const exp = Date.now() + EMAIL_ACTION_TTL_MS;
      const pauseUrl = `${appUrl}/api/medication/pause?uid=${profile.id}&exp=${exp}&t=${signEmailAction(
        profile.id,
        "pause",
        exp
      )}`;
      await sendEmail(
        email,
        `Did you pause your ${medLabel}?`,
        brandedEmail({
          title: "Did you pause your medication?",
          body: `<p style="margin:0 0 8px">We haven't seen a logged <strong style="color:#ffffff">${doseMg}mg ${medLabel}</strong> dose in a week.</p>
<p style="margin:0">Let us know so your protein and training plan stays accurate. This is the last reminder we'll send until you log a dose.</p>`,
          ctaText: "Yes, I paused it",
          ctaUrl: pauseUrl,
          secondaryCtaText: "I'm still taking it",
          secondaryCtaUrl: `${appUrl}/medication`,
          footer: "Either way, we won't email you about doses again until you log one.",
        })
      );
      processed++;
    }
  }

  return NextResponse.json({ ok: true, processed, date: todayStr });
}
