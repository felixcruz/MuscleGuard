import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextDueDate } from "@/lib/personalization";
import { brandedEmail } from "@/lib/email-template";

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
      from: "MuscleGuard <noreply@muscleguard.app>",
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://muscleguard.app";

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
    .not("glp1_last_dose_date", "is", null);

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

    if (daysOverdue === 0) {
      // Due today — soft reminder
      await sendEmail(
        email,
        `Your ${doseMg}mg ${medLabel} dose is due today`,
        brandedEmail({
          title: "Your dose is due today",
          body: `<p style="margin:0 0 8px">Your <strong style="color:#ffffff">${doseMg}mg ${medLabel}</strong> dose is scheduled for today.</p>
<p style="margin:0">Log it in MuscleGuard to keep your protein and training plan accurate.</p>`,
          ctaText: "Log dose taken",
          ctaUrl: `${appUrl}/medication`,
        })
      );
      processed++;
    } else if (daysOverdue === 1 || daysOverdue === 2) {
      // 1-2 days overdue — active reminder
      await sendEmail(
        email,
        `Haven't logged your ${medLabel} dose yet?`,
        brandedEmail({
          title: `Your dose is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
          body: `<p style="margin:0 0 8px">It looks like you haven't logged your <strong style="color:#ffffff">${doseMg}mg ${medLabel}</strong> dose yet.</p>
<p style="margin:0">Your protein and training plan is personalized to your medication schedule. Logging your dose keeps your recommendations accurate.</p>`,
          ctaText: "Log your dose now",
          ctaUrl: `${appUrl}/medication`,
        })
      );
      processed++;
    } else if (daysOverdue >= 3) {
      // 3+ days overdue — critical reminder
      await sendEmail(
        email,
        `Your dose is ${daysOverdue} days overdue`,
        brandedEmail({
          title: `${daysOverdue} days since your last dose`,
          body: `<p style="margin:0 0 8px">Your <strong style="color:#ffffff">${doseMg}mg ${medLabel}</strong> dose is now <strong style="color:#FFB4AB">${daysOverdue} days overdue</strong>.</p>
<p style="margin:0 0 8px">When your medication schedule changes, your protein targets and training intensity may also need to adjust.</p>
<p style="margin:0">If you've paused or changed your medication, you can log that too and your plan will automatically adjust.</p>`,
          ctaText: "Update medication status",
          ctaUrl: `${appUrl}/medication`,
          footer: "Consistent medication tracking helps MuscleGuard keep your plan accurate.",
        })
      );
      processed++;
    }
  }

  return NextResponse.json({ ok: true, processed, date: todayStr });
}
