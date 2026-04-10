import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("protein_streak_days, protein_streak_last_date, total_points")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const lastDate = profile.protein_streak_last_date as string | null;

  // Already counted today — no-op
  if (lastDate === today) {
    return NextResponse.json({ streak: profile.protein_streak_days, points: profile.total_points });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = lastDate === yesterdayStr
    ? profile.protein_streak_days + 1
    : 1; // broken or first time

  const newPoints = (profile.total_points ?? 0) + 10;

  await supabase.from("profiles").update({
    protein_streak_days: newStreak,
    protein_streak_last_date: today,
    total_points: newPoints,
  }).eq("id", user.id);

  return NextResponse.json({ streak: newStreak, points: newPoints, awarded: 10 });
}
