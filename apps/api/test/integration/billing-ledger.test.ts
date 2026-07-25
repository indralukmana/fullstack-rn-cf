import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { billingEvent, entitlement } from "../../src/db/schema";

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
});
