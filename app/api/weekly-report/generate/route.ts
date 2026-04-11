import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateWeeklyReportForUser,
  getLastCompletedWeekBounds,
} from "@/lib/weekly-report";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Optionally accept a specific week; default to last completed week
  let weekStart: string;
  let weekEnd: string;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.weekStart && body.weekEnd) {
      weekStart = body.weekStart;
      weekEnd = body.weekEnd;
    } else {
      ({ weekStart, weekEnd } = getLastCompletedWeekBounds());
    }
  } catch {
    ({ weekStart, weekEnd } = getLastCompletedWeekBounds());
  }

  const report = await generateWeeklyReportForUser(
    user.id,
    weekStart,
    weekEnd,
    supabase
  );

  if (!report) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }

  return NextResponse.json({ report });
}
