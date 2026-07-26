import { and, eq, ne, sql } from "drizzle-orm";

import type { Database } from "../../db/client";
import type { AppBindings } from "../config";
import type { ProviderEnvironment } from "./providers/types";

import { billingEvent } from "../../db/schema";
import { getBillingCatalog } from "./catalog";
import { projectProviderGrants } from "./project-grants";
import { retrieveRevenueCatGrants } from "./providers/revenuecat";
import { listStripeCustomerGrants, retrieveStripeGrant } from "./providers/stripe";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stripeTarget(payload: Record<string, unknown>) {
  const data = record(payload.data);
  const object = record(data?.object);
  if (!object) {
    return { subscriptionId: null, customerId: null };
  }
  const parent = record(object.parent);
  const subscriptionDetails = record(parent?.subscription_details);
  return {
    subscriptionId:
      object.object === "subscription"
        ? string(object.id)
        : (string(object.subscription) ?? string(subscriptionDetails?.subscription)),
    customerId: string(object.customer),
  };
}

function revenueCatTarget(payload: Record<string, unknown>, env: AppBindings) {
  const event = record(payload.event);
  if (!event) {
    throw new Error("RevenueCat event payload is missing event data");
  }
  const userId = string(event.app_user_id);
  const appId = string(event.app_id);
  const environmentValue = string(event.environment)?.toLowerCase();
  if (!userId || !appId || (environmentValue !== "sandbox" && environmentValue !== "production")) {
    throw new Error("RevenueCat event is missing identity, app, or environment");
  }
  const providerEnvironment: ProviderEnvironment =
    environmentValue === "sandbox" ? "sandbox" : "production";

  const catalog = getBillingCatalog(env);
  if (appId !== catalog.revenueCat.apps.ios && appId !== catalog.revenueCat.apps.android) {
    throw new Error("RevenueCat event references an unknown app");
  }
  const productId = string(event.product_id);
  if (productId) {
    const knownProducts = Object.values(catalog.revenueCat.products).flatMap((products) =>
      Object.values(products),
    );
    if (!knownProducts.includes(productId)) {
      throw new Error("RevenueCat event references an unknown product");
    }
  }

  return {
    userId,
    providerEnvironment,
  };
}

async function processStripeEvent(
  db: Database,
  env: AppBindings,
  payload: Record<string, unknown>,
): Promise<void> {
  const target = stripeTarget(payload);
  if (target.subscriptionId) {
    const grant = await retrieveStripeGrant(env, target.subscriptionId);
    await projectProviderGrants(db, {
      userId: grant.userId,
      provider: "stripe",
      providerEnvironment: grant.providerEnvironment,
      entitlementKey: getBillingCatalog(env).entitlementKey,
      grants: [grant],
      completeSnapshot: false,
    });
    return;
  }

  if (!target.customerId) {
    return;
  }
  const customer = await db.query.billingCustomer.findFirst({
    where: {
      provider: "stripe",
      providerCustomerId: target.customerId,
    },
  });
  if (!customer || customer.subjectType !== "user") {
    throw new Error("Stripe event references an unknown customer");
  }
  const grants = await listStripeCustomerGrants(env, target.customerId);
  const environment = payload.livemode === true ? "production" : "sandbox";
  await projectProviderGrants(db, {
    userId: customer.subjectId,
    provider: "stripe",
    providerEnvironment: environment,
    entitlementKey: getBillingCatalog(env).entitlementKey,
    grants: grants.filter((grant) => grant.providerEnvironment === environment),
    completeSnapshot: true,
  });
}

async function processRevenueCatEvent(
  db: Database,
  env: AppBindings,
  payload: Record<string, unknown>,
): Promise<void> {
  const target = revenueCatTarget(payload, env);
  const grants = await retrieveRevenueCatGrants(env, target.userId);
  await projectProviderGrants(db, {
    userId: target.userId,
    provider: "revenuecat",
    providerEnvironment: target.providerEnvironment,
    entitlementKey: getBillingCatalog(env).entitlementKey,
    grants: grants.filter((grant) => grant.providerEnvironment === target.providerEnvironment),
    completeSnapshot: true,
  });
}

export async function processBillingEvent(
  db: Database,
  env: AppBindings,
  eventId: string,
): Promise<"processed" | "already_processed"> {
  const startedAt = Date.now();
  const event = await db.query.billingEvent.findFirst({
    where: { id: eventId },
  });
  if (!event) {
    throw new Error("Billing event was not found");
  }
  if (event.state === "processed") {
    return "already_processed";
  }

  const claimed = await db
    .update(billingEvent)
    .set({
      state: "processing",
      attempts: sql`${billingEvent.attempts} + 1`,
      lastError: null,
    })
    .where(and(eq(billingEvent.id, eventId), ne(billingEvent.state, "processed")))
    .returning({ id: billingEvent.id });
  if (claimed.length === 0) {
    return "already_processed";
  }

  try {
    if (event.provider === "stripe") {
      await processStripeEvent(db, env, event.payload);
    } else {
      await processRevenueCatEvent(db, env, event.payload);
    }
    await db
      .update(billingEvent)
      .set({ state: "processed", processedAt: new Date(), lastError: null })
      .where(eq(billingEvent.id, eventId));
    console.info(
      JSON.stringify({
        level: "info",
        event: "billing_event_processed",
        billingEventId: event.id,
        provider: event.provider,
        eventType: event.eventType,
        attempts: event.attempts + 1,
        durationMs: Date.now() - startedAt,
      }),
    );
    return "processed";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown billing processing error";
    await db
      .update(billingEvent)
      .set({ state: "failed", lastError: message.slice(0, 500) })
      .where(eq(billingEvent.id, eventId));
    console.error(
      JSON.stringify({
        level: "error",
        event: "billing_event_failed",
        billingEventId: event.id,
        provider: event.provider,
        eventType: event.eventType,
        attempts: event.attempts + 1,
        durationMs: Date.now() - startedAt,
        error: message.slice(0, 500),
      }),
    );
    throw error;
  }
}
