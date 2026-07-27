import { env } from "cloudflare:workers";
import { and, eq as sqlEq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import {
  billingEvent,
  entitlement,
  organization,
  providerGrant,
  purchaseAttempt,
} from "../../src/db/schema";
import { recomputeEntitlement } from "../../src/lib/billing/recompute-entitlement";

describe("billing ledger invariants", () => {
  it("deduplicates provider events for idempotent webhook processing", async () => {
    const db = createDb(env.DB);
    const providerEventId = `evt_${crypto.randomUUID()}`;

    await db.insert(billingEvent).values({
      id: crypto.randomUUID(),
      provider: "stripe",
      providerEventId,
      eventType: "customer.subscription.updated",
      payload: { id: providerEventId },
    });

    await expect(
      db.insert(billingEvent).values({
        id: crypto.randomUUID(),
        provider: "stripe",
        providerEventId,
        eventType: "customer.subscription.updated",
        payload: { id: providerEventId },
      }),
    ).rejects.toThrow(/Failed query/);

    const events = await db.select().from(billingEvent);
    expect(events.filter((event) => event.providerEventId === providerEventId)).toHaveLength(1);
  });

  it("keeps one authoritative entitlement projection per subject and key", async () => {
    const db = createDb(env.DB);
    const subjectId = `user_${crypto.randomUUID()}`;

    await db.insert(entitlement).values({
      id: crypto.randomUUID(),
      subjectType: "user",
      subjectId,
      key: "pro",
      status: "active",
      source: "manual",
    });

    await expect(
      db.insert(entitlement).values({
        id: crypto.randomUUID(),
        subjectType: "user",
        subjectId,
        key: "pro",
        status: "active",
        source: "manual",
      }),
    ).rejects.toThrow(/Failed query/);

    const entitlements = await db.select().from(entitlement);
    expect(
      entitlements.filter((item) => item.subjectId === subjectId && item.key === "pro"),
    ).toHaveLength(1);
  });

  it("rejects unsupported billing states at the database boundary", async () => {
    await expect(
      env.DB.prepare(
        "INSERT INTO billing_event (id, provider, provider_event_id, event_type, payload, state) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(
          crypto.randomUUID(),
          "unknown-provider",
          crypto.randomUUID(),
          "unknown",
          "{}",
          "received",
        )
        .run(),
    ).rejects.toThrow(/constraint/i);
  });

  it("derives access with OR semantics across provider grants", async () => {
    const db = createDb(env.DB);
    const subjectId = `user_${crypto.randomUUID()}`;
    const now = new Date("2026-07-26T00:00:00.000Z");
    const future = new Date("2026-08-26T00:00:00.000Z");

    await db.insert(providerGrant).values([
      {
        id: crypto.randomUUID(),
        subjectType: "user",
        subjectId,
        entitlementKey: "pro",
        provider: "stripe",
        providerEnvironment: "production",
        providerGrantId: `sub_${crypto.randomUUID()}`,
        productId: "price_monthly",
        interval: "monthly",
        status: "active",
        occurredAt: now,
        expiresAt: future,
        lastProviderState: "active",
      },
      {
        id: crypto.randomUUID(),
        subjectType: "user",
        subjectId,
        entitlementKey: "pro",
        provider: "revenuecat",
        providerEnvironment: "production",
        providerGrantId: `rc_${crypto.randomUUID()}`,
        productId: "ios_monthly",
        interval: "monthly",
        status: "revoked",
        occurredAt: now,
        lastProviderState: "REFUND",
      },
    ]);

    await recomputeEntitlement(db, {
      subjectType: "user",
      subjectId,
      entitlementKey: "pro",
      providerEnvironment: "production",
      now,
    });

    const projected = await db.query.entitlement.findFirst({
      where: { subjectId },
    });
    expect(projected).toMatchObject({
      status: "active",
      source: "stripe",
      expiresAt: future,
    });

    await db
      .update(providerGrant)
      .set({ status: "expired", lastProviderState: "canceled" })
      .where(
        and(sqlEq(providerGrant.subjectId, subjectId), sqlEq(providerGrant.provider, "stripe")),
      );
    await db
      .update(providerGrant)
      .set({
        status: "active",
        expiresAt: future,
        lastProviderState: "RESTORE",
      })
      .where(
        and(sqlEq(providerGrant.subjectId, subjectId), sqlEq(providerGrant.provider, "revenuecat")),
      );
    await recomputeEntitlement(db, {
      subjectType: "user",
      subjectId,
      entitlementKey: "pro",
      providerEnvironment: "production",
      now,
    });
    expect(
      await db.query.entitlement.findFirst({
        where: { subjectId },
      }),
    ).toMatchObject({ status: "active", source: "revenuecat" });

    await db
      .update(providerGrant)
      .set({ status: "revoked", lastProviderState: "REFUND" })
      .where(
        and(sqlEq(providerGrant.subjectId, subjectId), sqlEq(providerGrant.provider, "revenuecat")),
      );
    await recomputeEntitlement(db, {
      subjectType: "user",
      subjectId,
      entitlementKey: "pro",
      providerEnvironment: "production",
      now,
    });
    expect(
      await db.query.entitlement.findFirst({
        where: { subjectId },
      }),
    ).toMatchObject({ status: "expired" });
  });

  it("does not let sandbox grants unlock production access", async () => {
    const db = createDb(env.DB);
    const subjectId = `user_${crypto.randomUUID()}`;
    const now = new Date("2026-07-26T00:00:00.000Z");

    await db.insert(providerGrant).values({
      id: crypto.randomUUID(),
      subjectType: "user",
      subjectId,
      entitlementKey: "pro",
      provider: "revenuecat",
      providerEnvironment: "sandbox",
      providerGrantId: `rc_${crypto.randomUUID()}`,
      productId: "ios_monthly",
      interval: "monthly",
      status: "active",
      occurredAt: now,
      lastProviderState: "INITIAL_PURCHASE",
    });

    await recomputeEntitlement(db, {
      subjectType: "user",
      subjectId,
      entitlementKey: "pro",
      providerEnvironment: "production",
      now,
    });

    const projected = await db.query.entitlement.findFirst({
      where: { subjectId },
    });
    expect(projected?.status).toBe("revoked");
  });

  it("deduplicates purchase attempts by idempotency key", async () => {
    const db = createDb(env.DB);
    const organizationId = `org_${crypto.randomUUID()}`;
    await db.insert(organization).values({
      id: organizationId,
      name: "Purchase Org",
      slug: `purchase-${organizationId.slice(0, 12)}`,
      createdAt: new Date(),
    });
    const idempotencyKey = `checkout_${crypto.randomUUID()}`;
    const attempt = {
      userId: `user_${crypto.randomUUID()}`,
      organizationId,
      provider: "stripe" as const,
      providerEnvironment: "sandbox" as const,
      interval: "monthly" as const,
      idempotencyKey,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    };

    await db.insert(purchaseAttempt).values({ id: crypto.randomUUID(), ...attempt });
    await expect(
      db.insert(purchaseAttempt).values({ id: crypto.randomUUID(), ...attempt }),
    ).rejects.toThrow(/Failed query/);
  });
});
