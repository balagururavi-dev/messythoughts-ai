/**
 * Simple sliding-window rate limiter.
 *
 * IMPORTANT: This uses an in-memory Map and is therefore scoped to a single
 * Node/serverless isolate. On Vercel and similar platforms, each instance has
 * its own map, so this is best-effort abuse protection—not distributed
 * production-grade rate limiting. For fleet-wide limits, use a shared store
 * (Redis / Upstash / edge KV) instead.
 */

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; remaining: number; resetAt: number; retryAfterSeconds: number };

export type RateLimitOptions = {
  /** Maximum requests allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Optional clock for tests. */
  now?: () => number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const nowFn = options.now ?? (() => Date.now());

  function prune(current: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= current) {
        buckets.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    const current = nowFn();
    prune(current);

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= current) {
      const resetAt = current + options.windowMs;
      buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: Math.max(0, options.limit - 1),
        resetAt,
      };
    }

    if (existing.count >= options.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - current) / 1000),
      );
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfterSeconds,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - existing.count),
      resetAt: existing.resetAt,
    };
  }

  function resetForTests() {
    buckets.clear();
  }

  return { check, resetForTests };
}

/** Default extract-route limiter: 10 requests / minute / client key. */
export const extractRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

export function getClientRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return `ip:${first}`;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return `ip:${realIp}`;
  }

  return "ip:anonymous";
}
