import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextDueDate } from "@/lib/personalization";

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

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

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
        `<p>Hi,</p>
<p>This is a friendly reminder that your <strong>${doseMg}mg ${medLabel}</strong> dose is scheduled for today.</p>
<p>Log it in <a href="https://muscleguard.app/medication">MuscleGuard</a> to keep your protein and training plan accurate.</p>
<p>Your body, your muscle — stay consistent.</p>
<p>— The MuscleGuard Team</p>`
      );
      processed++;
    } else if (daysOverdue === 1 || daysOverdue === 2) {
      // 1-2 days overdue — active reminder
      await sendEmail(
        email,
        `Haven't logged your ${medLabel} dose yet?`,
        `<p>Hi,</p>
<p>It looks like you haven't logged your <strong>${doseMg}mg ${medLabel}</strong> dose yet — it was due ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago.</p>
<p>Your MuscleGuard protein and training plan is personalized to your medication schedule. Logging your dose helps us keep your recommendations accurate.</p>
<p><a href="https://muscleguard.app/medication">Log your dose now →</a></p>
<p>— The MuscleGuard Team</p>`
      );
      processed++;
    } else if (daysOverdue >= 3) {
      // 3+ days overdue — critical reminder
      await sendEmail(
        email,
        `Your dose is ${daysOverdue} days overdue — your plan may be less accurate`,
        `<p>Hi,</p>
<p>Your <strong>${doseMg}mg ${medLabel}</strong> dose is now <strong>${daysOverdue} days overdue</strong>.</p>
<p>When your medication schedule changes, your protein targets and training intensity may also need to adjust. Please log your dose or any changes to keep your plan accurate.</p>
<p><a href="https://muscleguard.app/medication">Update your medication status →</a></p>
<p>If you've paused or changed your medication, you can log that too — your plan will automatically adjust.</p>
<p>— The MuscleGuard Team</p>`
      );
      processed++;
    }
  }

  return NextResponse.json({ ok: true, processed, date: todayStr });
}
