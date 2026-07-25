import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import app from "../../src/index";

describe("API smoke", () => {
  it("GET /health returns 200", async () => {
    const response = await app.request("/health", {}, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "rn-cf-api",
    });
  });

  it("GET /doc returns OpenAPI JSON", async () => {
    const response = await app.request("/doc", {}, env);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      openapi: string;
      info: { title: string };
    };

    expect(body.openapi).toBe("3.0.0");
    expect(body.info.title).toBe("RN CF API");
  });

  it("OPTIONS /health includes CORS headers for local web origins", async () => {
    const response = await app.request(
      "/health",
      {
        method: "OPTIONS",
        headers: {
          Origin: "http://127.0.0.1:8081",
          "Access-Control-Request-Method": "GET",
        },
      },
      env,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://127.0.0.1:8081");
  });

  it("GET /api/auth/ok responds for auth handler", async () => {
    const response = await app.request("/api/auth/ok", {}, env);

    expect(response.status).toBe(200);
  });
});
