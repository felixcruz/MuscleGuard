import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-click links for emails.
 *
 * Emails can only send GET requests, so an action link carries the user id in
 * the URL. The HMAC proves the link came from us and can't be forged or
 * replayed against another user id.
 */
function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to sign email links");
  return key;
}

export function signEmailAction(userId: string, action: string): string {
  return createHmac("sha256", secret())
    .update(`${action}:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyEmailAction(
  userId: string,
  action: string,
  token: string
): boolean {
  if (!token) return false;
  const expected = Buffer.from(signEmailAction(userId, action));
  const given = Buffer.from(token);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}
