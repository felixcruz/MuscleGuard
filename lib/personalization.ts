export type Goal = "preserve_muscle" | "build_strength" | "general_health";
export type AppetiteLevel = "none" | "mild" | "moderate" | "severe" | "very_severe";

export const SEMAGLUTIDE_DOSES = [0.25, 0.5, 1.0, 1.7, 2.4];
export const TIRZEPATIDE_DOSES = [2.5, 5, 7.5, 10, 12.5, 15];

/**
 * Calculate protein goal in grams based on weight, goal, and dose.
 * base_per_kg: preserve_muscle=1.3, build_strength=1.5, general_health=1.1
 * dose_multiplier: <=0.5→1.0, <=1.7→1.15, <2.4→1.25, >=2.4→1.35
 */
export function calculateProteinGoal(
  weightKg: number,
  goal: Goal,
  doseMg: number
): number {
  const basePerKg =
    goal === "build_strength" ? 1.5 :
    goal === "general_health" ? 1.1 :
    1.3; // preserve_muscle

  const doseMultiplier =
    doseMg <= 0.5 ? 1.0 :
    doseMg <= 1.7 ? 1.15 :
    doseMg < 2.4  ? 1.25 :
    1.35;

  return Math.round(weightKg * basePerKg * doseMultiplier);
}

/**
 * Training intensity 0-100: dose_adj * appetite_adj * 100
 * dose_adj: <=0.5→1.0, <=1.7→0.95, <2.4→0.90, >=2.4→0.85
 * appetite_adj: none→0.85, mild→0.92, moderate→0.98, severe→0.80, very_severe→0.70
 */
export function calculateTrainingIntensityPct(
  doseMg: number,
  appetiteLevel: AppetiteLevel
): number {
  const doseAdj =
    doseMg <= 0.5 ? 1.0 :
    doseMg <= 1.7 ? 0.95 :
    doseMg < 2.4  ? 0.90 :
    0.85;

  const appetiteAdj =
    appetiteLevel === "none"       ? 0.85 :
    appetiteLevel === "mild"       ? 0.92 :
    appetiteLevel === "moderate"   ? 0.98 :
    appetiteLevel === "severe"     ? 0.80 :
    appetiteLevel === "very_severe"? 0.70 :
    0.98;

  return Math.round(doseAdj * appetiteAdj * 100);
}

/**
 * Distribute protein across meals based on best appetite time.
 * early_morning: breakfast 40%, lunch 30%, dinner 20%, snack 10%
 * midday: breakfast 20%, lunch 40%, dinner 30%, snack 10%
 * evening: breakfast 15%, lunch 25%, dinner 45%, snack 15%
 * variable/default: breakfast 25%, lunch 30%, dinner 30%, snack 15%
 */
export function proteinMealBreakdown(
  totalG: number,
  bestAppetiteTime: string
): { breakfast: number; lunch: number; dinner: number; snack: number } {
  let pcts: [number, number, number, number];

  if (bestAppetiteTime === "early_morning") {
    pcts = [0.40, 0.30, 0.20, 0.10];
  } else if (bestAppetiteTime === "midday") {
    pcts = [0.20, 0.40, 0.30, 0.10];
  } else if (bestAppetiteTime === "evening") {
    pcts = [0.15, 0.25, 0.45, 0.15];
  } else {
    // variable or default
    pcts = [0.25, 0.30, 0.30, 0.15];
  }

  return {
    breakfast: Math.round(totalG * pcts[0]),
    lunch:     Math.round(totalG * pcts[1]),
    dinner:    Math.round(totalG * pcts[2]),
    snack:     Math.round(totalG * pcts[3]),
  };
}

/**
 * Human-readable explanation of protein goal.
 */
export function proteinGoalExplanation(
  weightKg: number,
  goal: Goal,
  doseMg: number,
  medication: string
): string {
  const basePerKg =
    goal === "build_strength" ? 1.5 :
    goal === "general_health" ? 1.1 :
    1.3;

  const doseMultiplier =
    doseMg <= 0.5 ? 1.0 :
    doseMg <= 1.7 ? 1.15 :
    doseMg < 2.4  ? 1.25 :
    1.35;

  const basePct = Math.round((doseMultiplier - 1) * 100);
  const baseG   = Math.round(weightKg * basePerKg);
  const totalG  = Math.round(weightKg * basePerKg * doseMultiplier);
  const extraG  = totalG - baseG;

  const medLabel =
    medication === "semaglutide" ? "semaglutide" :
    medication === "tirzepatide" ? "tirzepatide" :
    medication;

  if (basePct === 0) {
    return `At ${doseMg}mg ${medLabel}, your protein goal is ${totalG}g/day to preserve muscle.`;
  }

  return `Your ${doseMg}mg ${medLabel} dose requires ${basePct}% more protein (+${extraG}g) to preserve muscle during weight loss.`;
}

/**
 * Returns intensity label, color string, and advice.
 * >=95: Full intensity / green
 * >=85: Moderate / blue
 * >=75: Reduced / amber
 * <75:  Light / orange
 */
export function intensityInfo(pct: number): {
  label: string;
  colorClass: string;
  advice: string;
} {
  if (pct >= 95) {
    return {
      label: "Full intensity",
      colorClass: "green",
      advice: "Great conditions to push hard.",
    };
  }
  if (pct >= 85) {
    return {
      label: "Moderate",
      colorClass: "blue",
      advice: "Focus on form. Slightly lighter weight.",
    };
  }
  if (pct >= 75) {
    return {
      label: "Reduced",
      colorClass: "amber",
      advice: "Quality over quantity today.",
    };
  }
  return {
    label: "Light",
    colorClass: "orange",
    advice: "Mobility and light work only. Your body is managing suppression.",
  };
}

/**
 * Next due date given last dose date and frequency.
 * weekly: +7 days, biweekly: +14 days, monthly: +1 month
 */
export function getNextDueDate(
  lastDoseDate: string | null,
  frequency: string
): Date | null {
  if (!lastDoseDate) return null;

  const last = new Date(lastDoseDate + "T12:00:00Z");

  if (frequency === "weekly") {
    last.setDate(last.getDate() + 7);
  } else if (frequency === "biweekly") {
    last.setDate(last.getDate() + 14);
  } else if (frequency === "monthly") {
    last.setMonth(last.getMonth() + 1);
  } else {
    // Default to weekly
    last.setDate(last.getDate() + 7);
  }

  return last;
}

/**
 * Medication alert status.
 */
export function getMedicationStatus(nextDueDate: Date | null): {
  daysUntil: number;
  status: "on_schedule" | "due_today" | "active" | "critical";
  label: string;
  colorClass: string;
} {
  if (!nextDueDate) {
    return {
      daysUntil: 0,
      status: "active",
      label: "No dose logged yet",
      colorClass: "orange",
    };
  }

  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dueMs   = Date.UTC(nextDueDate.getUTCFullYear(), nextDueDate.getUTCMonth(), nextDueDate.getUTCDate());
  const daysUntil = Math.floor((dueMs - todayMs) / (1000 * 60 * 60 * 24));

  if (daysUntil > 0) {
    return {
      daysUntil,
      status: "on_schedule",
      label: `In ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
      colorClass: "green",
    };
  }
  if (daysUntil === 0) {
    return {
      daysUntil: 0,
      status: "due_today",
      label: "Due today",
      colorClass: "amber",
    };
  }
  // Overdue
  const daysOverdue = Math.abs(daysUntil);
  if (daysOverdue >= 3) {
    return {
      daysUntil,
      status: "critical",
      label: `${daysOverdue} days overdue`,
      colorClass: "red",
    };
  }
  return {
    daysUntil,
    status: "active",
    label: `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
    colorClass: "orange",
  };
}
