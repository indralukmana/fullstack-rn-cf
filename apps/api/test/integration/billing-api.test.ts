import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { entitlement, providerGrant, user } from "../../src/db/schema";
import { getApi, postApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

describe("personal billing API", () => {
  it("returns server-authoritative grant status and enforces paid capabilities", async () => {
    const email = `billing-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const db = createDb(env.DB);
    const storedUser = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (!storedUser) {
      throw new Error("missing test user");
    }
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
      expiresAt,
      managementUrl: "https://play.google.com/store/account/subscriptions",
      lastProviderState: "RENEWAL",
    });
    await db.insert(entitlement).values({
      id: crypto.randomUUID(),
      subjectType: "user",
      subjectId: storedUser.id,
      key: "pro",
      status: "active",
      source: "revenuecat",
      expiresAt,
      computedAt: new Date(),
    });

    const response = await getApi("/api/billing/status", account.cookie);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      entitlement: "pro",
      hasAccess: true,
      status: "active",
      grants: [{ provider: "revenuecat", interval: "monthly", status: "active" }],
    });
    expect((await getApi("/api/private/pro", account.cookie)).status).toBe(200);
  });

  it("rejects paid capabilities without an aggregate entitlement", async () => {
    const account = await signUpVerifiedUser({
      email: `free-${crypto.randomUUID()}@example.com`,
    });
    const response = await getApi("/api/private/pro", account.cookie);
    expect(response.status).toBe(403);
  });

  it("requires email verification before checkout", async () => {
    const email = `unverified-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    await createDb(env.DB).update(user).set({ emailVerified: false }).where(eq(user.email, email));
    const response = await postApi(
      "/api/billing/checkout",
      { interval: "monthly" },
      account.cookie,
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "email_verification_required",
    });
  });

  it("does not create a portal session without a Stripe customer", async () => {
    const account = await signUpVerifiedUser({
      email: `portal-${crypto.randomUUID()}@example.com`,
    });
    const response = await postApi("/api/billing/portal", undefined, account.cookie);
    expect(response.status).toBe(404);
  });
});
