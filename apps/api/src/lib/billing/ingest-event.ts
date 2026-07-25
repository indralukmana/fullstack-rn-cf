import type { Database } from "../../db/client";

import { billingEvent } from "../../db/schema";

export type BillingProvider = "stripe" | "revenuecat";

export type IngestBillingEventInput = {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export async function ingestBillingEvent(
  db: Database,
  input: IngestBillingEventInput,
): Promise<{ duplicate: boolean }> {
  const inserted = await db
    .insert(billingEvent)
    .values({
      id: crypto.randomUUID(),
      provider: input.provider,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      payload: input.payload,
    })
    .onConflictDoNothing({
      target: [billingEvent.provider, billingEvent.providerEventId],
    })
    .returning({ id: billingEvent.id });

  return { duplicate: inserted.length === 0 };
}
