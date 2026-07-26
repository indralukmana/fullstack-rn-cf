import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDb } from "../../src/db/client";
import { billingEvent, providerGrant, user } from "../../src/db/schema";
import { processBillingEvent } from "../../src/lib/billing/process-event";

function revenueCatResponse(productId: string) {
  return new Response(
    JSON.stringify({
      subscriber: {
        management_url: "https://play.google.com/store/account/subscriptions",
        subscriptions: {
          [productId]: {
            expires_date: "2026-08-26T00:00:00.000Z",
            purchase_date: "2026-07-26T00:00:00.000Z",
            original_purchase_date: "2026-07-26T00:00:00.000Z",
            store: "play_store",
            store_transaction_id: `GPA.${crypto.randomUUID()}`,
            is_sandbox: false,
          },
        },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("billing event processing", () => {
  it("projects an authoritative RevenueCat snapshot idempotently", async () => {
    const db = createDb(env.DB);
    const userId = `user_${crypto.randomUUID()}`;
    const eventId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name: "Billing Customer",
      email: `${userId}@example.com`,
      emailVerified: true,
    });
    await db.insert(billingEvent).values({
      id: eventId,
      provider: "revenuecat",
      providerEventId: crypto.randomUUID(),
      eventType: "RENEWAL",
      providerEnvironment: "production",
      occurredAt: new Date(),
      payload: {
        event: {
          id: crypto.randomUUID(),
          type: "RENEWAL",
          app_user_id: userId,
          app_id: env.REVENUECAT_ANDROID_APP_ID,
          environment: "PRODUCTION",
          product_id: env.REVENUECAT_ANDROID_PRODUCT_MONTHLY,
        },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => revenueCatResponse(env.REVENUECAT_ANDROID_PRODUCT_MONTHLY)),
    );

    await expect(processBillingEvent(db, env, eventId)).resolves.toBe("processed");
    await expect(processBillingEvent(db, env, eventId)).resolves.toBe("already_processed");

    const grants = await db.select().from(providerGrant).where(eq(providerGrant.subjectId, userId));
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      provider: "revenuecat",
      providerEnvironment: "production",
      status: "active",
      interval: "monthly",
    });
    const storedEvent = await db.query.billingEvent.findFirst({
      where: { id: eventId },
    });
    expect(storedEvent).toMatchObject({ state: "processed", attempts: 1 });
  });

  it("fails closed for an unknown RevenueCat app", async () => {
    const db = createDb(env.DB);
    const eventId = crypto.randomUUID();
    await db.insert(billingEvent).values({
      id: eventId,
      provider: "revenuecat",
      providerEventId: crypto.randomUUID(),
      eventType: "RENEWAL",
      payload: {
        event: {
          app_user_id: `user_${crypto.randomUUID()}`,
          app_id: "unknown-app",
          environment: "PRODUCTION",
        },
      },
    });

    await expect(processBillingEvent(db, env, eventId)).rejects.toThrow("unknown app");
    const storedEvent = await db.query.billingEvent.findFirst({
      where: { id: eventId },
    });
    expect(storedEvent?.state).toBe("failed");
  });

  it("fails closed for an unknown provider environment", async () => {
    const db = createDb(env.DB);
    const eventId = crypto.randomUUID();
    await db.insert(billingEvent).values({
      id: eventId,
      provider: "revenuecat",
      providerEventId: crypto.randomUUID(),
      eventType: "INITIAL_PURCHASE",
      payload: {
        event: {
          app_user_id: `user_${crypto.randomUUID()}`,
          app_id: env.REVENUECAT_IOS_APP_ID,
          environment: "STAGING",
        },
      },
    });

    await expect(processBillingEvent(db, env, eventId)).rejects.toThrow(
      "missing identity, app, or environment",
    );
  });
});
