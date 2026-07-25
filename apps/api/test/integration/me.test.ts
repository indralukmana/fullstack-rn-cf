import { describe, expect, it } from "vitest";

import { getApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("GET /api/me", () => {
  it("returns null user when unauthenticated", async () => {
    const response = await getApi("/api/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  it("returns the signed-in user when a session cookie is present", async () => {
    const email = `me-${Date.now()}@example.com`;
    const { cookie } = await signUpVerifiedUser({
      email,
      name: "Session User",
    });

    expect(cookie).toBeTruthy();

    const response = await getApi("/api/me", cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        email,
        name: "Session User",
      },
    });
  });
});
