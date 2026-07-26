import type { Database } from "../../db/client";

import { billingEvent } from "../../db/schema";

export type BillingProvider = "stripe" | "revenuecat";

export type IngestBillingEventInput = {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  providerEnvironment?: "sandbox" | "production";
  occurredAt?: Date;
  payload: Record<string, unknown>;
};

export async function ingestBillingEvent(
  db: Database,
  input: IngestBillingEventInput,
): Promise<{ duplicate: boolean; eventId: string }> {
  const eventId = crypto.randomUUID();
  const inserted = await db
    .insert(billingEvent)
    .values({
      id: eventId,
      provider: input.provider,
      providerEventId: input.providerEventId,
      eventType: input.eventType,
      providerEnvironment: input.providerEnvironment,
      occurredAt: input.occurredAt,
      payload: input.payload,
    })
    .onConflictDoNothing({
      target: [billingEvent.provider, billingEvent.providerEventId],
    })
    .returning({ id: billingEvent.id });

  if (inserted.length > 0) {
    return { duplicate: false, eventId };
  }

  const existing = await db.query.billingEvent.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.provider, input.provider), eq(table.providerEventId, input.providerEventId)),
    columns: { id: true },
  });
  if (!existing) {
    throw new Error("Could not resolve duplicate billing event");
  }
  return { duplicate: true, eventId: existing.id };
}
