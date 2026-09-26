import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropic } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const WINDOW_DAYS = 30; // fixed: exactly the last 30 days

function ymd(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface WeekBucket {
  index: number; // 1..4
  start: string;
  end: string;
  daysLogged: number;
  daysHit: number;
  avgProtein: number; // over logged days
  workouts: number;
  weightEnd: number | null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`doctor-summary:${user.id}`, 5, 600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const locale = new URL(request.url).searchParams.get("locale") === "es" ? "es" : "en";

  // Fixed 30-day window ending today (inclusive).
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
  const startYmd = ymd(start);
  const endYmd = ymd(end);
  const startMs = new Date(startYmd + "T00:00:00Z").getTime();
  const dayOffset = (d: string) =>
    Math.floor((new Date(d + "T00:00:00Z").getTime() - startMs) / 86400000);
  // 4 buckets aligned to 7-day weeks: 0-6, 7-13, 14-20, 21-29 (week 4 holds 9 days)
  const weekOf = (offset: number) => Math.min(3, Math.floor(offset / 7));

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, glp1_medication, glp1_dose_mg, glp1_frequency, protein_goal_g, weight_kg, target_weight_kg, primary_goal"
    )
    .eq("id", user.id)
    .single();

  const proteinGoalG = Math.round(profile?.protein_goal_g ?? 120);

  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("log_date, protein_g")
    .eq("user_id", user.id)
    .gte("log_date", startYmd)
    .lte("log_date", endYmd);

  const byDay: Record<string, number> = {};
  for (const log of foodLogs ?? []) {
    byDay[log.log_date] = (byDay[log.log_date] ?? 0) + Number(log.protein_g ?? 0);
  }
  const daysLogged = Object.keys(byDay).length;
  const proteinValues = Object.values(byDay);
  const daysHit = proteinValues.filter((p) => p >= proteinGoalG * 0.8).length;
  const avgProteinLoggedDays = daysLogged
    ? Math.round(proteinValues.reduce((a, b) => a + b, 0) / daysLogged)
    : 0;

  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", `${startYmd}T00:00:00Z`)
    .lte("completed_at", `${endYmd}T23:59:59Z`);
  const workoutsCount = workoutLogs?.length ?? 0;

  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("measured_at, weight_kg")
    .eq("user_id", user.id)
    .gte("measured_at", startYmd)
    .lte("measured_at", endYmd)
    .order("measured_at", { ascending: true });

  const weights = (measurements ?? []).filter((m) => m.weight_kg != null);
  const firstWeight = weights.length ? Number(weights[0].weight_kg) : null;
  const lastWeight = weights.length ? Number(weights[weights.length - 1].weight_kg) : null;
  const weightChange =
    firstWeight != null && lastWeight != null
      ? Math.round((lastWeight - firstWeight) * 10) / 10
      : null;
  const weightRatePerWeek =
    weightChange != null ? Math.round((weightChange / (WINDOW_DAYS / 7)) * 10) / 10 : null;

  // ---- Weekly breakdown (trajectory) ----
  const buckets: {
    proteinSum: number;
    daysLogged: number;
    daysHit: number;
    workouts: number;
    weightEnd: number | null;
  }[] = Array.from({ length: 4 }, () => ({
    proteinSum: 0,
    daysLogged: 0,
    daysHit: 0,
    workouts: 0,
    weightEnd: null,
  }));

  for (const [date, protein] of Object.entries(byDay)) {
    const w = weekOf(dayOffset(date));
    buckets[w].proteinSum += protein;
    buckets[w].daysLogged += 1;
    if (protein >= proteinGoalG * 0.8) buckets[w].daysHit += 1;
  }
  for (const wl of workoutLogs ?? []) {
    const w = weekOf(dayOffset(String(wl.completed_at).split("T")[0]));
    buckets[w].workouts += 1;
  }
  for (const m of weights) {
    const w = weekOf(dayOffset(String(m.measured_at).split("T")[0]));
    buckets[w].weightEnd = Number(m.weight_kg); // last write wins (ordered asc)
  }

  const weekly: WeekBucket[] = buckets.map((b, i) => {
    const bStart = new Date(startMs + i * 7 * 86400000);
    const bEndOffset = i === 3 ? WINDOW_DAYS - 1 : i * 7 + 6;
    const bEnd = new Date(startMs + bEndOffset * 86400000);
    return {
      index: i + 1,
      start: ymd(bStart),
      end: ymd(bEnd),
      daysLogged: b.daysLogged,
      daysHit: b.daysHit,
      avgProtein: b.daysLogged ? Math.round(b.proteinSum / b.daysLogged) : 0,
      workouts: b.workouts,
      weightEnd: b.weightEnd,
    };
  });

  // ---- Trends ----
  const firstHalfAvg =
    buckets[0].daysLogged + buckets[1].daysLogged > 0
      ? (buckets[0].proteinSum + buckets[1].proteinSum) /
        (buckets[0].daysLogged + buckets[1].daysLogged)
      : 0;
  const secondHalfAvg =
    buckets[2].daysLogged + buckets[3].daysLogged > 0
      ? (buckets[2].proteinSum + buckets[3].proteinSum) /
        (buckets[2].daysLogged + buckets[3].daysLogged)
      : 0;
  let proteinTrend: "up" | "down" | "flat" = "flat";
  if (firstHalfAvg > 0 || secondHalfAvg > 0) {
    const delta = secondHalfAvg - firstHalfAvg;
    const rel = firstHalfAvg > 0 ? delta / firstHalfAvg : 1;
    if (rel > 0.08) proteinTrend = "up";
    else if (rel < -0.08) proteinTrend = "down";
  }

  const adherencePct = Math.round((daysHit / WINDOW_DAYS) * 100);
  const avgProteinPctOfGoal = proteinGoalG
    ? Math.round((avgProteinLoggedDays / proteinGoalG) * 100)
    : 0;
  const loggingPct = Math.round((daysLogged / WINDOW_DAYS) * 100);

  const trends = {
    proteinTrend,
    firstHalfAvgProtein: Math.round(firstHalfAvg),
    secondHalfAvgProtein: Math.round(secondHalfAvg),
    adherencePct,
    avgProteinPctOfGoal,
    loggingPct,
    weightRatePerWeek,
  };

  const medication =
    profile?.glp1_medication || (locale === "es" ? "medicamento GLP-1" : "GLP-1 medication");
  const doseMg = profile?.glp1_dose_mg ?? null;

  const stats = {
    proteinGoalG,
    daysLogged,
    daysHit,
    avgProteinLoggedDays,
    workoutsCount,
    firstWeight,
    lastWeight,
    weightChange,
  };

  // ---- AI analysis ----
  const langLine = locale === "es" ? "Escribe en español." : "Write in English.";
  const weeklyLines = weekly
    .map(
      (w) =>
        `  Semana ${w.index} (${w.start}–${w.end}): proteína prom ${w.avgProtein} g, días en meta ${w.daysHit}/${w.daysLogged || 0} registrados, ${w.workouts} entrenamientos${
          w.weightEnd != null ? `, peso ${w.weightEnd} kg` : ""
        }`
    )
    .join("\n");

  const trendWord =
    proteinTrend === "up"
      ? locale === "es"
        ? "al alza"
        : "improving"
      : proteinTrend === "down"
        ? locale === "es"
          ? "a la baja"
          : "declining"
        : locale === "es"
          ? "estable"
          : "steady";

  const dataBlock =
    locale === "es"
      ? `Datos que el paciente registró en la app en los últimos 30 días (${startYmd} a ${endYmd}). El objetivo de proteína lo calcula Stoova a partir del onboarding (peso, dosis y meta del paciente), no lo fija un médico.
- Medicamento: ${medication}${doseMg ? `, dosis ${doseMg} mg` : ""}
- Objetivo diario de proteína (calculado por la app): ${proteinGoalG} g
- Registró alimentos ${daysLogged}/30 días (${loggingPct}% de constancia)
- Alcanzó ≥80% del objetivo: ${daysHit}/30 días (${adherencePct}%)
- Proteína promedio en días registrados: ${avgProteinLoggedDays} g (${avgProteinPctOfGoal}% del objetivo)
- Entrenamientos de fuerza: ${workoutsCount} en 30 días
- Peso: ${firstWeight != null && lastWeight != null ? `${firstWeight} → ${lastWeight} kg (${weightChange} kg, ~${weightRatePerWeek} kg/semana)` : "sin datos suficientes"}
- Tendencia de proteína (primera vs segunda mitad): ${trendWord} (${Math.round(firstHalfAvg)} g → ${Math.round(secondHalfAvg)} g)
Desglose semanal:
${weeklyLines}`
      : `Data the patient tracked in the app over the last 30 days (${startYmd} to ${endYmd}). The protein target is calculated by Stoova from onboarding (the patient's weight, dose and goal); it is not set by a clinician.
- Medication: ${medication}${doseMg ? `, dose ${doseMg} mg` : ""}
- Daily protein target (app-calculated): ${proteinGoalG} g
- Logged food ${daysLogged}/30 days (${loggingPct}% consistency)
- Met ≥80% of target: ${daysHit}/30 days (${adherencePct}%)
- Average protein on logged days: ${avgProteinLoggedDays} g (${avgProteinPctOfGoal}% of target)
- Resistance-training sessions: ${workoutsCount} in 30 days
- Weight: ${firstWeight != null && lastWeight != null ? `${firstWeight} → ${lastWeight} kg (${weightChange} kg, ~${weightRatePerWeek} kg/week)` : "insufficient data"}
- Protein trend (first vs second half): ${trendWord} (${Math.round(firstHalfAvg)} g → ${Math.round(secondHalfAvg)} g)
Weekly breakdown:
${weeklyLines}`;

  const prompt = `You are writing the narrative of a progress report that a person using a GLP-1 medication will bring to their doctor. ${langLine}

Audience: BOTH the patient (non-clinical) and their clinician. Write clear, professional prose a layperson can follow but a clinician will find substantive. No hype, no emojis, no headings, no bullet points.

${dataBlock}

Write three short paragraphs (about 170 words total):
1) Trajectory — how the patient is doing and which direction they are heading. Interpret the weekly breakdown and the protein trend (${trendWord}). Say plainly whether protein consistency and training are improving, holding, or slipping, using the specific numbers.
2) What it means for muscle — connect protein intake and resistance training to preserving lean mass while losing weight at ~${weightRatePerWeek ?? "?"} kg/week. Note the relationship between the rate of weight loss and whether protein is keeping pace. This is educational context, not a diagnosis.
3) Focus and discussion — 1 or 2 concrete, encouraging things the patient can focus on next, and 1 or 2 neutral points to raise with their doctor (for example, whether the app-calculated protein target still fits as the dose changes).

Strict rules:
- The protein target is calculated by the app from the patient's onboarding data. NEVER say a clinician, doctor or "we" set the target.
- This summarizes self-tracked data; it is NOT medical advice or a diagnosis.
- Do NOT recommend changing medication, dose, or treatment; the clinician decides that.
- Do NOT state as fact that muscle was or wasn't preserved — speak in terms of what supports muscle preservation.
- Plain text only.`;

  let summary = "";
  try {
    const msg = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    summary = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";

    try {
      const admin = createAdminClient();
      await admin.from("api_usage_logs").insert({
        feature: "doctor_summary",
        model: MODEL,
        input_tokens: msg.usage?.input_tokens ?? 0,
        output_tokens: msg.usage?.output_tokens ?? 0,
        cost_usd:
          (msg.usage?.input_tokens ?? 0) * 0.0000008 +
          (msg.usage?.output_tokens ?? 0) * 0.000004,
        user_id: user.id,
      });
    } catch {
      /* best-effort */
    }
  } catch {
    const dir =
      proteinTrend === "up"
        ? locale === "es"
          ? "mejorando"
          : "improving"
        : proteinTrend === "down"
          ? locale === "es"
            ? "bajando"
            : "slipping"
          : locale === "es"
            ? "estable"
            : "holding steady";
    summary =
      locale === "es"
        ? `En 30 días registraste alimentos ${daysLogged} de 30 días y alcanzaste al menos el 80% de tu objetivo de proteína (${proteinGoalG} g, calculado por la app) en ${daysHit} días. Tu proteína promedio fue ${avgProteinLoggedDays} g (${avgProteinPctOfGoal}% del objetivo) y la tendencia va ${dir}, con ${workoutsCount} entrenamientos de fuerza.\n\nMantener la proteína cerca del objetivo junto con el entrenamiento de resistencia es lo que más apoya la conservación de masa magra mientras bajas de peso${weightRatePerWeek != null ? ` (~${weightRatePerWeek} kg/semana)` : ""}.\n\nUn buen próximo paso es sostener la constancia de proteína un día más por semana. Puedes conversar con tu médico si el objetivo de proteína sigue siendo adecuado a medida que cambia tu dosis.`
        : `Over 30 days you logged food on ${daysLogged} of 30 days and met at least 80% of your protein target (${proteinGoalG} g, app-calculated) on ${daysHit} days. Your average protein was ${avgProteinLoggedDays} g (${avgProteinPctOfGoal}% of target) and the trend is ${dir}, alongside ${workoutsCount} resistance-training sessions.\n\nKeeping protein close to target together with resistance training is what most supports preserving lean mass while you lose weight${weightRatePerWeek != null ? ` (~${weightRatePerWeek} kg/week)` : ""}.\n\nA good next step is holding protein consistency one more day per week. You may want to discuss with your doctor whether the protein target still fits as your dose changes.`;
  }

  return NextResponse.json({
    patient: {
      name: profile?.full_name || null,
      medication,
      doseMg,
      frequency: profile?.glp1_frequency || null,
    },
    window: { start: startYmd, end: endYmd, days: WINDOW_DAYS },
    stats,
    trends,
    weekly,
    summary,
    generatedAt: new Date().toISOString(),
  });
}
