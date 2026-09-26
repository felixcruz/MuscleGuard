// The daily protein target lives in lib/personalization.ts (calculateProteinGoal),
// which is the single source of truth. This file keeps the progress helpers.

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
