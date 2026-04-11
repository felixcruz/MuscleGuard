import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateWeeklyReportForUser, getLastCompletedWeekBounds } from "@/lib/weekly-report";

// Vercel cron: runs every Sunday at 23:00 UTC
// Secured via CRON_SECRET environment variable
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { weekStart, weekEnd } = getLastCompletedWeekBounds();

  // Fetch all users who completed onboarding
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("onboarding_done", true);

  if (error) {
    console.error("[cron/weekly-report] fetch profiles error", error.message);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  const userIds = (profiles ?? []).map((p) => p.id as string);
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const report = await generateWeeklyReportForUser(
        userId,
        weekStart,
        weekEnd,
        supabase
      );
      if (report) {
        generated++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`[cron/weekly-report] user ${userId}`, err);
      failed++;
    }
  }

  console.log(
    `[cron/weekly-report] week=${weekStart} generated=${generated} skipped=${skipped} failed=${failed}`
  );

  return NextResponse.json({ weekStart, weekEnd, generated, skipped, failed });
}
