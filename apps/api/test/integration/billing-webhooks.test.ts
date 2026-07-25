import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import app from "../../src";
import { createDb } from "../../src/db/client";
import { billingEvent } from "../../src/db/schema";

const apiOrigin = "http://127.0.0.1:8787";

async function hmacSha256Hex(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function stripeSignature(payload: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacSha256Hex(`${timestamp}.${payload}`, env.STRIPE_WEBHOOK_SECRET);
  return `t=${timestamp},v1=${signature}`;
}

async function postWebhook(
  provider: "stripe" | "revenuecat",
  payload: string,
  headers: Record<string, string>,
) {
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request(`${apiOrigin}/api/webhooks/${provider}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: payload,
    }),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

describe("billing webhook ingestion", () => {
  it("verifies and deduplicates Stripe events", async () => {
    const eventId = `evt_${crypto.randomUUID()}`;
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: `sub_${crypto.randomUUID()}` } },
    });
    const signature = await stripeSignature(payload);

    const first = await postWebhook("stripe", payload, {
      "Stripe-Signature": signature,
    });
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ received: true, duplicate: false });

    const duplicate = await postWebhook("stripe", payload, {
      "Stripe-Signature": signature,
    });
    expect(duplicate.status).toBe(200);
    await expect(duplicate.json()).resolves.toEqual({ received: true, duplicate: true });

    const stored = await createDb(env.DB)
      .select()
      .from(billingEvent)
      .where(and(eq(billingEvent.provider, "stripe"), eq(billingEvent.providerEventId, eventId)));
    expect(stored).toHaveLength(1);
  });

  it("rejects an invalid Stripe signature without persisting the payload", async () => {
    const eventId = `evt_${crypto.randomUUID()}`;
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      type: "customer.created",
      data: { object: {} },
    });

    const response = await postWebhook("stripe", payload, {
      "Stripe-Signature": "t=0,v1=invalid",
    });
    expect(response.status).toBe(400);

    const stored = await createDb(env.DB)
      .select()
      .from(billingEvent)
      .where(eq(billingEvent.providerEventId, eventId));
    expect(stored).toHaveLength(0);
  });

  it("authenticates and deduplicates RevenueCat events", async () => {
    const eventId = crypto.randomUUID();
    const payload = JSON.stringify({
      api_version: "1.0",
      event: {
        id: eventId,
        type: "RENEWAL",
        app_user_id: `user_${crypto.randomUUID()}`,
      },
    });

    const rejected = await postWebhook("revenuecat", payload, {
      Authorization: "Bearer wrong-secret",
    });
    expect(rejected.status).toBe(401);

    const first = await postWebhook("revenuecat", payload, {
      Authorization: env.REVENUECAT_WEBHOOK_AUTHORIZATION,
    });
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ received: true, duplicate: false });

    const duplicate = await postWebhook("revenuecat", payload, {
      Authorization: env.REVENUECAT_WEBHOOK_AUTHORIZATION,
    });
    await expect(duplicate.json()).resolves.toEqual({ received: true, duplicate: true });
  });
});
