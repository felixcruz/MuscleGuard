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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // AI generation is metered — cap it per user.
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

  // Profile (own row, RLS-safe)
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, glp1_medication, glp1_dose_mg, glp1_frequency, protein_goal_g, weight_kg, primary_goal"
    )
    .eq("id", user.id)
    .single();

  const proteinGoalG = Math.round(profile?.protein_goal_g ?? 120);

  // Protein by day over the window
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

  // Workouts over the window
  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("workout_day")
    .eq("user_id", user.id)
    .gte("completed_at", `${startYmd}T00:00:00Z`)
    .lte("completed_at", `${endYmd}T23:59:59Z`);
  const workoutsCount = workoutLogs?.length ?? 0;

  // Weight trend over the window
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

  const medication = profile?.glp1_medication || (locale === "es" ? "medicamento GLP-1" : "GLP-1 medication");
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

  // ---- AI summary: professional, shared clinician/patient language ----
  const langLine =
    locale === "es"
      ? "Escribe en español."
      : "Write in English.";

  const dataBlock =
    locale === "es"
      ? `Datos auto-registrados por el paciente en los últimos 30 días (${startYmd} a ${endYmd}):
- Medicamento: ${medication}${doseMg ? `, dosis ${doseMg} mg` : ""}
- Objetivo diario de proteína: ${proteinGoalG} g
- Días que registró alimentos: ${daysLogged}/30
- Días que alcanzó ≥80% del objetivo de proteína: ${daysHit}/30
- Promedio de proteína en días registrados: ${avgProteinLoggedDays} g
- Sesiones de entrenamiento de fuerza completadas: ${workoutsCount}
- Cambio de peso registrado: ${weightChange != null ? `${weightChange} kg` : "sin datos suficientes"}`
      : `Patient self-reported data over the last 30 days (${startYmd} to ${endYmd}):
- Medication: ${medication}${doseMg ? `, dose ${doseMg} mg` : ""}
- Daily protein target: ${proteinGoalG} g
- Days with food logged: ${daysLogged}/30
- Days meeting ≥80% of protein target: ${daysHit}/30
- Average protein on logged days: ${avgProteinLoggedDays} g
- Resistance-training sessions completed: ${workoutsCount}
- Recorded weight change: ${weightChange != null ? `${weightChange} kg` : "insufficient data"}`;

  const prompt = `You are preparing a concise progress summary that a person using a GLP-1 medication will bring to their doctor. ${langLine}

Audience: both the patient (non-clinical) and their clinician. Use clear, professional language a layperson can follow — accurate but not jargon-heavy, no hype, no emojis.

${dataBlock}

Write exactly two short paragraphs, ~120 words total:
1. Summarize what these numbers show about protein intake and resistance-training consistency in the context of preserving lean muscle during GLP-1 weight loss. Be specific with the numbers. Be balanced — acknowledge both strengths and gaps.
2. Offer 1–2 neutral, non-prescriptive points the patient may want to discuss with their clinician (for example, whether the current protein target still fits their goals as their dose changes).

Strict rules:
- This is a summary of self-tracked data, NOT medical advice or a diagnosis.
- Do NOT recommend changing medication, dose, or treatment. The clinician is the decision-maker.
- Do NOT claim clinical outcomes or that muscle was or wasn't preserved.
- Plain text only. No headings, no bullet points, no emojis.`;

  let summary = "";
  try {
    const msg = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    summary = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";

    // Meter the cost.
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
      // usage logging is best-effort
    }
  } catch {
    summary =
      locale === "es"
        ? `En los últimos 30 días registraste alimentos en ${daysLogged} de 30 días y alcanzaste al menos el 80% de tu objetivo de proteína (${proteinGoalG} g) en ${daysHit} días, con ${workoutsCount} sesiones de entrenamiento de fuerza. Mantener una ingesta adecuada de proteína y el entrenamiento de resistencia se asocia con la preservación de masa magra durante la pérdida de peso con GLP-1.\n\nEste es un resumen de datos que el paciente registró por su cuenta y no sustituye la evaluación clínica. Puede ser útil conversar con tu médico si el objetivo de proteína sigue siendo adecuado a medida que cambia tu dosis.`
        : `Over the last 30 days you logged food on ${daysLogged} of 30 days and met at least 80% of your protein target (${proteinGoalG} g) on ${daysHit} days, alongside ${workoutsCount} resistance-training sessions. Adequate protein intake together with resistance training is associated with preserving lean mass during GLP-1 weight loss.\n\nThis is a summary of data the patient tracked themselves and is not a substitute for clinical assessment. It may be worth discussing with your doctor whether the current protein target remains appropriate as your dose changes.`;
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
    summary,
    generatedAt: new Date().toISOString(),
  });
}
