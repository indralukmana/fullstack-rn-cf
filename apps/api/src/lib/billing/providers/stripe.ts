import Stripe from "stripe";

import type { AppBindings } from "../../config";
import type { GrantStatus, NormalizedProviderGrant } from "./types";

import { getBillingCatalog } from "../catalog";

function createStripe(env: AppBindings): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY must be set");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

function grantStatus(status: Stripe.Subscription.Status, expiresAt: Date | null): GrantStatus {
  if (status === "active" || status === "trialing") {
    return "active";
  }
  if (status === "past_due" || status === "unpaid") {
    return "grace_period";
  }
  if (status === "canceled" && expiresAt && expiresAt.getTime() > Date.now()) {
    return "active";
  }
  return status === "canceled" ? "expired" : "revoked";
}

function normalizeStripeSubscription(
  env: AppBindings,
  value: Stripe.Subscription,
): NormalizedProviderGrant {
  const catalog = getBillingCatalog(env);
  const item = value.items.data.at(0);
  if (!item || value.items.data.length !== 1) {
    throw new Error("Stripe subscription must contain exactly one catalog item");
  }

  const priceId = item.price.id;
  const interval =
    priceId === catalog.stripe.monthly
      ? ("monthly" as const)
      : priceId === catalog.stripe.yearly
        ? ("yearly" as const)
        : null;
  if (!interval) {
    throw new Error("Stripe subscription references an unknown price");
  }

  const organizationId = value.metadata.organizationId;
  if (!organizationId) {
    throw new Error("Stripe subscription is missing immutable organization metadata");
  }
  const customerId = typeof value.customer === "string" ? value.customer : value.customer?.id;
  if (!customerId) {
    throw new Error("Stripe subscription is missing a customer");
  }

  const expiresAt = item.current_period_end ? new Date(item.current_period_end * 1000) : null;
  return {
    provider: "stripe",
    providerEnvironment: value.livemode ? "production" : "sandbox",
    providerCustomerId: customerId,
    providerGrantId: value.id,
    subjectId: organizationId,
    productId: typeof item.price.product === "string" ? item.price.product : item.price.product.id,
    priceId,
    interval,
    status: grantStatus(value.status, expiresAt),
    occurredAt: new Date(),
    expiresAt,
    managementUrl: null,
    lastProviderState: value.status,
  };
}

export async function retrieveStripeGrant(
  env: AppBindings,
  subscriptionId: string,
): Promise<NormalizedProviderGrant> {
  const subscription = await createStripe(env).subscriptions.retrieve(subscriptionId);
  return normalizeStripeSubscription(env, subscription);
}

export async function listStripeCustomerGrants(
  env: AppBindings,
  customerId: string,
): Promise<NormalizedProviderGrant[]> {
  const subscriptions = await createStripe(env).subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  return subscriptions.data.map((subscription) => normalizeStripeSubscription(env, subscription));
}
