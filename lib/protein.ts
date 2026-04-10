const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.3,
  moderate: 1.4,
  intense: 1.6,
};

/**
 * Calculate daily protein goal for GLP-1 users.
 * Range 1.2–1.6 g/kg based on activity level to prevent muscle loss.
 */
export function calcProteinGoal(weightKg: number, activityLevel?: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel ?? ""] ?? 1.6;
  return Math.round(weightKg * multiplier);
}

/**
 * Calculate how many grams of protein remain to hit the daily goal.
 */
export function calcProteinRemaining(goalG: number, loggedG: number): number {
  return Math.max(0, goalG - loggedG);
}

/**
 * Calculate protein progress as a percentage (0–100).
 */
export function calcProteinPct(goalG: number, loggedG: number): number {
  if (goalG <= 0) return 0;
  return Math.min(100, Math.round((loggedG / goalG) * 100));
}
