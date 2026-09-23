import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-click links for emails.
 *
 * Emails can only send GET requests, so an action link carries the user id and
 * an expiry in the URL. The HMAC covers both, so the link can't be forged,
 * replayed against another user id, or have its expiry extended.
 */
function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to sign email links");
  return key;
}

export function signEmailAction(
  userId: string,
  action: string,
  expiresAt: number
): string {
  return createHmac("sha256", secret())
    .update(`${action}:${userId}:${expiresAt}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyEmailAction(
  userId: string,
  action: string,
  expiresAt: number,
  token: string
): boolean {
  if (!token || !Number.isFinite(expiresAt)) return false;
  // Expired links are rejected.
  if (Date.now() > expiresAt) return false;

  const expected = Buffer.from(signEmailAction(userId, action, expiresAt));
  const given = Buffer.from(token);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

// How long an emailed action link stays valid.
export const EMAIL_ACTION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
