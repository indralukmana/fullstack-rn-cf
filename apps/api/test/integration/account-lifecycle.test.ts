import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { providerGrant } from "../../src/db/schema";
import { deleteApi, getApi, postApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("account privacy lifecycle", () => {
  it("exports portable account and billing data with an audit record", async () => {
    const email = `export-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const response = await getApi("/api/account/export", account.cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      account: { email },
      memberships: [{ role: "owner", organizationId: expect.any(String) }],
      billingGrants: [],
    });
    const audit = await createDb(env.DB).query.billingAudit.findFirst({
      where: { action: "account_exported" },
    });
    expect(audit?.subjectUserId).toBeTruthy();
  });

  it("does not pretend account deletion cancels an active store subscription", async () => {
    const email = `subscribed-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const db = createDb(env.DB);
    const storedUser = await db.query.user.findFirst({ where: { email } });
    if (!storedUser) {
      throw new Error("missing test user");
    }
    const membership = await db.query.member.findFirst({
      where: { userId: storedUser.id, role: "owner" },
    });
    if (!membership) {
      throw new Error("missing owned organization");
    }
    await db.insert(providerGrant).values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: membership.organizationId,
      entitlementKey: "pro",
      provider: "revenuecat",
      providerEnvironment: "sandbox",
      providerGrantId: `rc_${crypto.randomUUID()}`,
      productId: env.REVENUECAT_ANDROID_PRODUCT_MONTHLY,
      interval: "monthly",
      status: "active",
      occurredAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastProviderState: "RENEWAL",
    });

    const response = await deleteApi("/api/account", account.cookie, {
      confirmation: "DELETE",
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "active_subscription" });
    expect(await db.query.user.findFirst({ where: { id: storedUser.id } })).toBeTruthy();
  });

  it("blocks account deletion while the user solely owns an organization", async () => {
    const email = `sole-owner-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const response = await deleteApi("/api/account", account.cookie, {
      confirmation: "DELETE",
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "sole_owner_organization",
    });
  });

  it("deletes an account after the sole-owned organization is closed", async () => {
    const email = `delete-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const db = createDb(env.DB);
    const storedUser = await db.query.user.findFirst({ where: { email } });
    if (!storedUser) {
      throw new Error("missing test user");
    }
    const membership = await db.query.member.findFirst({
      where: { userId: storedUser.id, role: "owner" },
    });
    if (!membership) {
      throw new Error("missing owned organization");
    }

    const closed = await postApi(
      "/api/auth/organization/delete",
      { organizationId: membership.organizationId },
      account.cookie,
    );
    expect(closed.status).toBe(200);

    const response = await deleteApi("/api/account", account.cookie, {
      confirmation: "DELETE",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(await db.query.user.findFirst({ where: { id: storedUser.id } })).toBeUndefined();
    expect(
      await db.query.billingAudit.findFirst({
        where: { subjectUserId: storedUser.id, action: "account_deleted" },
      }),
    ).toBeTruthy();
  });
});

describe("organization close blockers", () => {
  it("rejects closing an organization with an active subscription", async () => {
    const email = `close-blocked-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const db = createDb(env.DB);
    const storedUser = await db.query.user.findFirst({ where: { email } });
    if (!storedUser) {
      throw new Error("missing test user");
    }
    const membership = await db.query.member.findFirst({
      where: { userId: storedUser.id, role: "owner" },
    });
    if (!membership) {
      throw new Error("missing owned organization");
    }

    await db.insert(providerGrant).values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: membership.organizationId,
      entitlementKey: "pro",
      provider: "stripe",
      providerEnvironment: "sandbox",
      providerGrantId: `sub_${crypto.randomUUID()}`,
      productId: "price_monthly",
      interval: "monthly",
      status: "active",
      occurredAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastProviderState: "active",
    });

    const response = await postApi(
      "/api/auth/organization/delete",
      { organizationId: membership.organizationId },
      account.cookie,
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(
      await db.query.organization.findFirst({ where: { id: membership.organizationId } }),
    ).toBeTruthy();
  });
});
