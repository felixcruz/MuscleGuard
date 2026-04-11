import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnthropic } from "./anthropic";
import { getAIToneInstruction, type CommStyle } from "./comm-style";

export interface WeeklyReportData {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  grade: "A" | "B" | "C";
  score: number;
  protein_days_hit: number;
  workouts_count: number;
  total_protein_g: number;
  protein_goal_g: number;
  summary_text: string;
  created_at: string;
}

// Returns Monday and Sunday of the week containing `date`
function getWeekBounds(date: Date): { weekStart: string; weekEnd: string } {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + toMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split("T")[0],
    weekEnd: sunday.toISOString().split("T")[0],
  };
}

// The most recently completed week (Mon–Sun)
// If today is Sunday, that week counts as complete
export function getLastCompletedWeekBounds(): { weekStart: string; weekEnd: string } {
  const today = new Date();
  const day = today.getDay();
  if (day === 0) return getWeekBounds(today);
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - day);
  return getWeekBounds(lastSunday);
}

// Current running week (Monday to today)
export function getCurrentWeekBounds(): { weekStart: string; weekEnd: string } {
  return getWeekBounds(new Date());
}

function calcGrade(score: number): "A" | "B" | "C" {
  if (score >= 85) return "A";
  if (score >= 65) return "B";
  return "C";
}

export async function generateWeeklyReportForUser(
  userId: string,
  weekStart: string,
  weekEnd: string,
  supabase: SupabaseClient
): Promise<WeeklyReportData | null> {
  // Return existing report if already generated
  const { data: existing } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing) return existing as WeeklyReportData;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("protein_goal_g, glp1_medication, protein_streak_days, workout_streak_days, comm_style")
    .eq("id", userId)
    .single();

  const proteinGoalG = Math.round(profile?.protein_goal_g ?? 120);

  // Aggregate protein per day for the week
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("log_date, protein_g")
    .eq("user_id", userId)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd);

  const byDay: Record<string, number> = {};
  for (const log of foodLogs ?? []) {
    byDay[log.log_date] = (byDay[log.log_date] ?? 0) + Number(log.protein_g ?? 0);
  }
  const totalProteinG = Math.round(Object.values(byDay).reduce((a, b) => a + b, 0));
  // A day counts as "hit" if ≥80% of goal was logged
  const proteinDaysHit = Object.values(byDay).filter(
    (p) => p >= proteinGoalG * 0.8
  ).length;

  // Count workouts in the week
  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("workout_day")
    .eq("user_id", userId)
    .gte("completed_at", `${weekStart}T00:00:00Z`)
    .lte("completed_at", `${weekEnd}T23:59:59Z`);

  const workoutsCount = workoutLogs?.length ?? 0;

  // Score: protein consistency (65%) + workout consistency (35%)
  const proteinScore = (proteinDaysHit / 7) * 65;
  const workoutScore = Math.min(workoutsCount / 3, 1) * 35;
  const score = Math.round(proteinScore + workoutScore);
  const grade = calcGrade(score);

  // Generate AI summary
  const medication = profile?.glp1_medication ?? "GLP-1 medication";
  const commStyle = (profile?.comm_style ?? "balanced") as CommStyle;
  const toneInstruction = getAIToneInstruction(commStyle);
  const summaryPrompt = `You are a GLP-1 health coach writing a weekly progress report for a user on ${medication} who is trying to preserve muscle mass.
${toneInstruction}

Week of ${weekStart} to ${weekEnd}:
- Protein goal: ${proteinGoalG}g/day
- Days hitting ≥80% of protein goal: ${proteinDaysHit}/7
- Total protein consumed: ${totalProteinG}g
- Workouts completed: ${workoutsCount}
- Current protein streak: ${profile?.protein_streak_days ?? 0} days
- Grade earned: ${grade}

Write a 2-3 sentence personalized weekly summary. Be encouraging and specific about what happened. End with one concrete, actionable tip for next week. Speak directly as "You". Plain text, no emojis, under 80 words.`;

  let summaryText = "";
  try {
    const msg = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: summaryPrompt }],
    });
    summaryText =
      msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  } catch {
    summaryText =
      grade === "A"
        ? "Outstanding week — you hit your protein targets consistently and kept your workouts on track. That consistency is exactly what preserves muscle on GLP-1. Keep this momentum going next week."
        : grade === "B"
        ? "Solid effort this week. You showed up and put in the work — try to lock in protein on one more day next week to push toward an A."
        : "It was a tough week, but showing up at all is a win. Next week, focus on one high-protein meal each morning to build momentum early in the day.";
  }

  // Persist the report
  const { data: inserted, error } = await supabase
    .from("weekly_reports")
    .upsert(
      {
        user_id: userId,
        week_start: weekStart,
        week_end: weekEnd,
        grade,
        score,
        protein_days_hit: proteinDaysHit,
        workouts_count: workoutsCount,
        total_protein_g: totalProteinG,
        protein_goal_g: proteinGoalG,
        summary_text: summaryText,
      },
      { onConflict: "user_id,week_start" }
    )
    .select()
    .single();

  if (error) {
    console.error("[weekly-report] insert error", error.message);
    return null;
  }
  return inserted as WeeklyReportData;
}
