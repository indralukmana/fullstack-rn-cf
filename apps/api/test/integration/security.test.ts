import { describe, expect, it } from "vitest";

import { getApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("GET /api/private/ping", () => {
  it("returns 401 when unauthenticated", async () => {
    const response = await getApi("/api/private/ping");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "unauthorized",
    });
  });

  it("returns 200 when a session cookie is present", async () => {
    const email = `private-${Date.now()}@example.com`;
    const { cookie } = await signUpVerifiedUser({
      email,
      name: "Private User",
    });

    expect(cookie).toBeTruthy();

    const response = await getApi("/api/private/ping", cookie);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "rn-cf-api",
    });
  });
});

describe("security hardening", () => {
  it("sets security headers on responses", async () => {
    const response = await getApi("/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");
  });

  it("omits CORS allow-origin for disallowed origins", async () => {
    const { env } = await import("cloudflare:workers");
    const { app } = await import("../../src/index");
    const response = await app.request(
      "/health",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.example",
          "Access-Control-Request-Method": "GET",
        },
      },
      env,
    );

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
