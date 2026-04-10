/**
 * Simple in-memory rate limiter for MVP
 * Tracks requests per user ID
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const REQUESTS_PER_MINUTE = 5; // 5 requests per minute per user
const MINUTE_MS = 60 * 1000;

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + MINUTE_MS,
    };
    rateLimitStore.set(userId, newEntry);
    return {
      allowed: true,
      remaining: REQUESTS_PER_MINUTE - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment counter
  entry.count += 1;
  return {
    allowed: true,
    remaining: REQUESTS_PER_MINUTE - entry.count,
    resetAt: entry.resetAt,
  };
}

// Cleanup old entries every 5 minutes (only in runtime, not build time)
if (typeof globalThis !== "undefined" && typeof globalThis.setInterval === "function") {
  setInterval(() => {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    rateLimitStore.forEach((entry, userId) => {
      if (entry.resetAt < now) {
        entriesToDelete.push(userId);
      }
    });

    entriesToDelete.forEach((userId) => {
      rateLimitStore.delete(userId);
    });
  }, 5 * 60 * 1000);
}
