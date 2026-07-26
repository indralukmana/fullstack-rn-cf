import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { billingAudit, providerGrant, user } from "../../src/db/schema";
import { deleteApi, getApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("account privacy lifecycle", () => {
  it("exports portable account and billing data with an audit record", async () => {
    const email = `export-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const response = await getApi("/api/account/export", account.cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      account: { email },
      memberships: [],
      billingGrants: [],
    });
    const audit = await createDb(env.DB).query.billingAudit.findFirst({
      where: eq(billingAudit.action, "account_exported"),
    });
    expect(audit?.subjectUserId).toBeTruthy();
  });

  it("does not pretend account deletion cancels an active store subscription", async () => {
    const email = `subscribed-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const db = createDb(env.DB);
    const storedUser = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (!storedUser) {
      throw new Error("missing test user");
    }
    await db.insert(providerGrant).values({
      id: crypto.randomUUID(),
      subjectType: "user",
      subjectId: storedUser.id,
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
    expect(await db.query.user.findFirst({ where: eq(user.id, storedUser.id) })).toBeTruthy();
  });

  it("deletes an unsubscribed account while retaining a minimal audit", async () => {
    const email = `delete-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const db = createDb(env.DB);
    const storedUser = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (!storedUser) {
      throw new Error("missing test user");
    }

    const response = await deleteApi("/api/account", account.cookie, {
      confirmation: "DELETE",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: true });
    expect(await db.query.user.findFirst({ where: eq(user.id, storedUser.id) })).toBeUndefined();
    expect(
      await db.query.billingAudit.findFirst({
        where: eq(billingAudit.subjectUserId, storedUser.id),
      }),
    ).toMatchObject({ action: "account_deleted" });
  });
});
