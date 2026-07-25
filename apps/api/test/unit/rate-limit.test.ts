import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { rateLimit, resetRateLimitBuckets } from "../../src/middleware/rate-limit";

describe("rateLimit middleware", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("returns 429 after the max requests for a client key", async () => {
    const app = new Hono();
    app.use(
      "*",
      rateLimit({
        keyPrefix: "test",
        windowMs: 60_000,
        max: 2,
      }),
    );
    app.get("/", (c) => c.json({ ok: true }));

    const headers = { "cf-connecting-ip": "203.0.113.10" };
    const first = await app.request("/", { headers });
    const second = await app.request("/", { headers });
    const third = await app.request("/", { headers });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers.get("retry-after")).toBeTruthy();
    expect(first.headers.get("x-ratelimit-limit")).toBe("2");
  });
});
