import { createMiddleware } from "hono/factory";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
};

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function take(
  key: string,
  windowMs: number,
  max: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, max - 1), resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: existing.count <= max,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Best-effort per-isolate limiter. Prefer Cloudflare WAF rules at the edge. */
export function rateLimit(options: RateLimitOptions) {
  return createMiddleware(async (c, next) => {
    const key = `${options.keyPrefix}:${clientKey(c.req.raw)}`;
    const result = take(key, options.windowMs, options.max);

    c.header("X-RateLimit-Limit", String(options.max));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      c.header("Retry-After", String(retryAfter));
      return c.json(
        {
          error: "rate_limited",
          message: "Too many requests",
        },
        429,
      );
    }

    return next();
  });
}

/** Test helper — clears in-memory buckets between cases. */
export function resetRateLimitBuckets() {
  buckets.clear();
}
