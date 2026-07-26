import { Hono } from "hono";
import Stripe from "stripe";
import { z } from "zod";

import type { AppEnv } from "../app-env";

import { createDb } from "../db/client";
import { ingestBillingEvent } from "../lib/billing/ingest-event";

const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();

const revenueCatPayloadSchema = z.looseObject({
  event: z.looseObject({
    id: z.string().min(1),
    type: z.string().min(1),
    environment: z.enum(["SANDBOX", "PRODUCTION"]).optional(),
    event_timestamp_ms: z.number().optional(),
  }),
});

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= (leftBytes.at(index) ?? 0) ^ (rightBytes.at(index) ?? 0);
  }

  return difference === 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const billingWebhooks = new Hono<AppEnv>();

billingWebhooks.post("/stripe", async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "billing_unavailable", message: "Billing is unavailable" }, 503);
  }

  const signature = c.req.header("Stripe-Signature");
  if (!signature) {
    return c.json({ error: "invalid_webhook", message: "Invalid webhook signature" }, 400);
  }

  const rawBody = await c.req.text();
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
      undefined,
      stripeCryptoProvider,
    );
  } catch {
    return c.json({ error: "invalid_webhook", message: "Invalid webhook signature" }, 400);
  }

  const payload: unknown = JSON.parse(rawBody);
  if (!isRecord(payload)) {
    return c.json({ error: "invalid_webhook", message: "Invalid webhook payload" }, 400);
  }

  const result = await ingestBillingEvent(createDb(c.env.DB), {
    provider: "stripe",
    providerEventId: event.id,
    eventType: event.type,
    providerEnvironment: event.livemode ? "production" : "sandbox",
    occurredAt: new Date(event.created * 1000),
    payload,
  });
  await c.env.BILLING_QUEUE?.send({ eventId: result.eventId });

  return c.json({ received: true, duplicate: result.duplicate }, 200);
});

billingWebhooks.post("/revenuecat", async (c) => {
  if (!c.env.REVENUECAT_WEBHOOK_AUTHORIZATION) {
    return c.json({ error: "billing_unavailable", message: "Billing is unavailable" }, 503);
  }

  const authorization = c.req.header("Authorization") ?? "";
  if (!(await constantTimeEqual(authorization, c.env.REVENUECAT_WEBHOOK_AUTHORIZATION))) {
    return c.json({ error: "invalid_webhook", message: "Invalid webhook authorization" }, 401);
  }

  const parsed = revenueCatPayloadSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "invalid_webhook", message: "Invalid webhook payload" }, 400);
  }

  const result = await ingestBillingEvent(createDb(c.env.DB), {
    provider: "revenuecat",
    providerEventId: parsed.data.event.id,
    eventType: parsed.data.event.type,
    providerEnvironment:
      parsed.data.event.environment === "SANDBOX"
        ? "sandbox"
        : parsed.data.event.environment === "PRODUCTION"
          ? "production"
          : undefined,
    occurredAt:
      parsed.data.event.event_timestamp_ms === undefined
        ? undefined
        : new Date(parsed.data.event.event_timestamp_ms),
    payload: parsed.data,
  });
  await c.env.BILLING_QUEUE?.send({ eventId: result.eventId });

  return c.json({ received: true, duplicate: result.duplicate }, 200);
});
