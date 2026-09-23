/**
 * Durable rate limiter backed by Postgres.
 *
 * The previous implementation kept counters in a module-level Map. On Vercel
 * each serverless invocation may run in a different, short-lived instance, so
 * an in-memory counter is effectively per-request and does not limit anything.
 * This version calls an atomic Postgres function (check_rate_limit) via the
 * service role, so the limit is shared across every instance.
 */
import { createAdminClient } from "@/lib/supabase/admin";

const REQUESTS_PER_MINUTE = 5;
const WINDOW_SECONDS = 60;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * @param key   Identity to rate-limit on (e.g. a user id). Namespaced per route.
 * @param max   Max requests allowed in the window. Defaults to 5.
 * @param windowSeconds Window length in seconds. Defaults to 60.
 */
export async function checkRateLimit(
  key: string,
  max: number = REQUESTS_PER_MINUTE,
  windowSeconds: number = WINDOW_SECONDS
): Promise<RateLimitResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error || !data) {
      // Fail closed: if the limiter backend is unavailable, deny the request
      // rather than leaving an expensive endpoint (e.g. AI generation) wide open.
      return { allowed: false, remaining: 0, resetAt: Date.now() + windowSeconds * 1000 };
    }

    const result = data as { allowed: boolean; remaining: number; reset_at: number };
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.reset_at,
    };
  } catch {
    return { allowed: false, remaining: 0, resetAt: Date.now() + windowSeconds * 1000 };
  }
}
