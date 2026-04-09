/**
 * Calculate minimum daily protein goal for GLP-1 users.
 * Based on clinical recommendation of 1.6g per kg of body weight
 * to prevent muscle loss during caloric restriction.
 */
export function calcProteinGoal(weightKg: number): number {
  return Math.round(weightKg * 1.6);
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
