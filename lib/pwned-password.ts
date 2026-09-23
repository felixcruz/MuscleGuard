/**
 * Checks a password against the HaveIBeenPwned "Pwned Passwords" range API.
 *
 * This is the same data source Supabase uses for its Pro-plan leaked-password
 * protection, but done ourselves so it also works on the free plan. It uses
 * k-anonymity: only the first 5 chars of the SHA-1 hash leave this server, so
 * the password itself is never sent anywhere.
 *
 * Only admin passwords need this — regular users authenticate via email OTP and
 * have no password.
 */
import { createHash } from "node:crypto";

/**
 * @returns true if the password appears in a known breach corpus.
 *          Fails OPEN (returns false) if HIBP is unreachable, so a third-party
 *          outage can't block a legitimate admin from being created.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      // Don't hang the request on a slow third party.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;

    const text = await res.text();
    for (const line of text.split("\n")) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix === suffix && Number(countStr) > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
