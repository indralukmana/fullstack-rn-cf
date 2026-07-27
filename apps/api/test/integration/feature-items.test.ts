import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { seedDemoData, DEMO_OWNER_EMAIL, DEMO_MEMBER_EMAIL } from "../../src/lib/dev/seed-demo";
import { getApi, postApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("feature items", () => {
  it("lists and creates org-scoped items for the active organization", async () => {
    const account = await signUpVerifiedUser({
      email: `notes-${crypto.randomUUID()}@example.com`,
      name: "Notes Owner",
    });

    const orgs = (await (
      await getApi("/api/auth/organization/list", account.cookie)
    ).json()) as Array<{
      id: string;
    }>;
    expect(orgs[0]?.id).toBeTruthy();

    const created = await postApi(
      "/api/features/notes/items",
      { title: "Ship scaffold", body: "First note" },
      account.cookie,
    );
    expect(created.status).toBe(201);
    await expect(created.json()).resolves.toMatchObject({
      title: "Ship scaffold",
      body: "First note",
      featureKey: "notes",
      organizationId: orgs[0]?.id,
    });

    const listed = await getApi("/api/features/notes/items", account.cookie);
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toMatchObject({
      items: [expect.objectContaining({ title: "Ship scaffold" })],
    });
  });
});

describe("demo seed", () => {
  it("creates owner, member, and shared workspace idempotently", async () => {
    const first = await seedDemoData(env);
    expect(first.owner.email).toBe(DEMO_OWNER_EMAIL);
    expect(first.member.email).toBe(DEMO_MEMBER_EMAIL);
    expect(first.workspace.slug).toBe("demo-workspace");

    const second = await seedDemoData(env);
    expect(second.created).toEqual({
      owner: false,
      member: false,
      workspace: false,
      membership: false,
      entitlement: false,
    });
    expect(second.workspace.id).toBe(first.workspace.id);
  });
});
