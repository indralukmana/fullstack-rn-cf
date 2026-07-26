import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";

import { createDb } from "../../src/db/client";
import { billingEvent } from "../../src/db/schema";
import { runScheduledBillingMaintenance } from "../../src/lib/billing/worker-handlers";

describe("scheduled billing maintenance", () => {
  it("re-enqueues recoverable durable events", async () => {
    const eventId = crypto.randomUUID();
    await createDb(env.DB).insert(billingEvent).values({
      id: eventId,
      provider: "stripe",
      providerEventId: crypto.randomUUID(),
      eventType: "customer.subscription.updated",
      payload: {},
      state: "failed",
      attempts: 1,
      lastError: "transient provider failure",
    });
    const sendBatch = vi.fn(async () => undefined);

    await runScheduledBillingMaintenance({
      ...env,
      BILLING_QUEUE: {
        send: async () => undefined,
        sendBatch,
      },
    });

    expect(sendBatch).toHaveBeenCalledWith([{ body: { eventId } }]);
  });
});
