import { afterEach, describe, expect, it } from "vitest";
import {
  createRateLimiter,
  extractRateLimiter,
  getClientRateLimitKey,
} from "./rate-limit";

describe("rate-limit", () => {
  afterEach(() => {
    extractRateLimiter.resetForTests();
  });

  it("allows requests under the limit and blocks when exceeded", () => {
    let now = 1_000;
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1_000,
      now: () => now,
    });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    const blocked = limiter.check("a");
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }

    now += 1_001;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("isolates keys and reads client IP headers", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:2").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(false);

    const request = new Request("https://example.com/api", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      },
    });
    expect(getClientRateLimitKey(request)).toBe("ip:203.0.113.10");
  });
});
