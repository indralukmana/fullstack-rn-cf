import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { entitlement, member, providerGrant, user } from "../../src/db/schema";
import { getApi, postApi } from "../helpers/api-request";
import { signUpVerifiedUser } from "../helpers/email-auth";

async function personalOrganizationId(cookie: string | null) {
  const orgs = (await (await getApi("/api/auth/organization/list", cookie)).json()) as Array<{
    id: string;
  }>;
  const organizationId = orgs[0]?.id;
  if (!organizationId) {
    throw new Error("missing personal organization");
  }
  return organizationId;
}

describe("organization billing API", () => {
  it("returns server-authoritative grant status and enforces paid capabilities", async () => {
    const email = `billing-${crypto.randomUUID()}@example.com`;
    const account = await signUpVerifiedUser({ email });
    const organizationId = await personalOrganizationId(account.cookie);
    const db = createDb(env.DB);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(providerGrant).values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: organizationId,
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
      subjectType: "organization",
      subjectId: organizationId,
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

  it("lets invited members inherit organization entitlement", async () => {
    const suffix = crypto.randomUUID();
    const owner = await signUpVerifiedUser({
      email: `owner-share-${suffix}@example.com`,
      name: "Share Owner",
    });
    const memberAccount = await signUpVerifiedUser({
      email: `member-share-${suffix}@example.com`,
      name: "Share Member",
    });
    const organizationId = await personalOrganizationId(owner.cookie);
    const db = createDb(env.DB);
    const memberUser = await db.query.user.findFirst({ where: { email: memberAccount.email } });
    if (!memberUser) {
      throw new Error("missing member user");
    }

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: memberUser.id,
      role: "member",
      createdAt: new Date(),
    });

    const activated = await postApi(
      "/api/auth/organization/set-active",
      { organizationId },
      memberAccount.cookie,
    );
    expect(activated.status).toBe(200);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(providerGrant).values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: organizationId,
      entitlementKey: "pro",
      provider: "stripe",
      providerEnvironment: "sandbox",
      providerGrantId: `sub_${crypto.randomUUID()}`,
      productId: "price_monthly",
      interval: "monthly",
      status: "active",
      occurredAt: new Date(),
      expiresAt,
      lastProviderState: "active",
    });
    await db.insert(entitlement).values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: organizationId,
      key: "pro",
      status: "active",
      source: "stripe",
      expiresAt,
      computedAt: new Date(),
    });

    const status = await getApi("/api/billing/status", memberAccount.cookie);
    expect(status.status).toBe(200);
    await expect(status.json()).resolves.toMatchObject({ hasAccess: true });
    expect((await getApi("/api/private/pro", memberAccount.cookie)).status).toBe(200);

    const checkout = await postApi(
      "/api/billing/checkout",
      { interval: "monthly" },
      memberAccount.cookie,
    );
    expect(checkout.status).toBe(403);
  });
});
