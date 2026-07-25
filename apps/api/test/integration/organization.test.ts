import { describe, expect, it } from "vitest";

import { getApi, postApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("organization integration", () => {
  it("requires authentication to list organizations", async () => {
    const response = await getApi("/api/auth/organization/list");

    expect(response.status).toBe(401);
  });

  it("creates an organization and owner membership for a verified user", async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID()}`;
    const account = await signUpVerifiedUser({
      email: `owner-${suffix}@example.com`,
      name: "Organization Owner",
    });

    expect(account.cookie).toBeTruthy();

    const created = await postApi(
      "/api/auth/organization/create",
      {
        name: "Acme Company",
        slug: `acme-${suffix}`,
      },
      account.cookie,
    );

    expect(created.status).toBe(200);
    await expect(created.json()).resolves.toMatchObject({
      name: "Acme Company",
      slug: `acme-${suffix}`,
      members: [
        {
          role: "owner",
          userId: expect.any(String),
        },
      ],
    });

    const listed = await getApi("/api/auth/organization/list", account.cookie);
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toEqual([
      expect.objectContaining({
        name: "Acme Company",
        slug: `acme-${suffix}`,
      }),
    ]);
  });
});
