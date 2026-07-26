import { and, eq, gt, inArray, lt, or } from "drizzle-orm";

import type { AuthEnv } from "../better-auth";
import type { BillingQueueMessage } from "../config";

import { createDb } from "../../db/client";
import { billingCustomer, billingEvent } from "../../db/schema";
import { getRuntimeConfig } from "../config";
import { processBillingEvent } from "./process-event";
import { reconcileBillingCustomer } from "./reconcile-customer";

export async function handleBillingQueue(
  batch: MessageBatch<BillingQueueMessage>,
  env: AuthEnv,
): Promise<void> {
  const db = createDb(env.DB);
  await Promise.all(
    batch.messages.map(async (message) => {
      try {
        await processBillingEvent(db, env, message.body.eventId);
        message.ack();
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "billing_event_processing_failed",
            billingEventId: message.body.eventId,
            queueMessageId: message.id,
            error: error instanceof Error ? error.message : "unknown",
          }),
        );
        message.retry({ delaySeconds: 60 });
      }
    }),
  );
}

export async function runScheduledBillingMaintenance(env: AuthEnv): Promise<void> {
  if (!env.BILLING_QUEUE) {
    throw new Error("BILLING_QUEUE binding is required for scheduled billing maintenance");
  }
  const db = createDb(env.DB);
  const config = getRuntimeConfig(env);
  const recoverable = await db
    .select({ id: billingEvent.id })
    .from(billingEvent)
    .where(
      and(
        or(eq(billingEvent.state, "received"), eq(billingEvent.state, "failed")),
        lt(billingEvent.attempts, 5),
      ),
    )
    .limit(config.billingReconciliationLimit);

  if (recoverable.length > 0) {
    await env.BILLING_QUEUE.sendBatch(
      recoverable.map((event) => ({ body: { eventId: event.id } })),
    );
  }

  const recentSince = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const customers = await db
    .select()
    .from(billingCustomer)
    .where(gt(billingCustomer.updatedAt, recentSince))
    .limit(config.billingReconciliationLimit);
  const results = await Promise.allSettled(
    customers.map((customer) => reconcileBillingCustomer(db, env, customer)),
  );
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        JSON.stringify({
          level: "error",
          event: "billing_customer_reconciliation_failed",
          billingCustomerId: customers.at(index)?.id,
          error: result.reason instanceof Error ? result.reason.message : "unknown",
        }),
      );
    }
  }

  const retentionCutoff = new Date(
    Date.now() - config.billingEventRetentionDays * 24 * 60 * 60 * 1000,
  );
  await db
    .delete(billingEvent)
    .where(
      and(
        inArray(billingEvent.state, ["processed", "failed"]),
        lt(billingEvent.receivedAt, retentionCutoff),
      ),
    );
}

export function handleScheduledBilling(
  _controller: ScheduledController,
  env: AuthEnv,
  ctx: ExecutionContext,
): void {
  ctx.waitUntil(runScheduledBillingMaintenance(env));
}
