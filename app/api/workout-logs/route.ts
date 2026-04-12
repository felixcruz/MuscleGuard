import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekKey = request.nextUrl.searchParams.get("weekKey");
  if (!weekKey) return NextResponse.json({ logs: [] });

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("workout_day")
    .eq("user_id", user.id)
    .eq("week_key", weekKey);

  return NextResponse.json({ logs: logs ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { workout_day, week_key, action } = body as {
    workout_day: string;
    week_key: string;
    action: string;
  };

  if (!workout_day || !week_key || !action || typeof workout_day !== "string" || typeof week_key !== "string") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (action !== "complete" && action !== "uncomplete") {
    return NextResponse.json({ error: "Action must be 'complete' or 'uncomplete'" }, { status: 400 });
  }

  if (action === "uncomplete") {
    await supabase.from("workout_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("workout_day", workout_day)
      .eq("week_key", week_key);

    // Decrement workout count
    const { data: prof } = await supabase
      .from("profiles")
      .select("workout_streak_days, total_points")
      .eq("id", user.id)
      .single();
    if (prof) {
      const newStreak = Math.max(0, (prof.workout_streak_days ?? 1) - 1);
      await supabase.from("profiles").update({
        workout_streak_days: newStreak,
        total_points: Math.max(0, (prof.total_points ?? 5) - 5),
      }).eq("id", user.id);
      return NextResponse.json({ ok: true, streak: newStreak });
    }
    return NextResponse.json({ ok: true });
  }

  // Insert workout log
  await supabase.from("workout_logs").upsert({
    user_id: user.id,
    workout_day,
    week_key,
    completed_at: new Date().toISOString(),
  }, { onConflict: "user_id,workout_day,week_key" });

  // Update workout streak + award 5 points
  const today = new Date().toISOString().split("T")[0];
  const { data: profile } = await supabase
    .from("profiles")
    .select("workout_streak_days, workout_streak_last_date, total_points")
    .eq("id", user.id)
    .single();

  if (profile) {
    const newStreak = (profile.workout_streak_days ?? 0) + 1;

    await supabase.from("profiles").update({
      workout_streak_days: newStreak,
      workout_streak_last_date: today,
      total_points: (profile.total_points ?? 0) + 5,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true, streak: newStreak });
  }

  return NextResponse.json({ ok: true });
}
