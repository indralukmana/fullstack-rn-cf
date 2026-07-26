import { z } from "zod";

import type { AppBindings } from "../../config";
import type { GrantStatus, NormalizedProviderGrant, ProviderEnvironment } from "./types";

import { getBillingCatalog, type BillingInterval } from "../catalog";

const subscriptionSchema = z.looseObject({
  expires_date: z.string().nullable().optional(),
  grace_period_expires_date: z.string().nullable().optional(),
  billing_issues_detected_at: z.string().nullable().optional(),
  original_purchase_date: z.string().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  store: z.string().optional(),
  store_transaction_id: z.string().optional(),
  is_sandbox: z.boolean().optional(),
});

const subscriberResponseSchema = z.looseObject({
  subscriber: z.looseObject({
    management_url: z.string().nullable().optional(),
    subscriptions: z.record(z.string(), subscriptionSchema),
  }),
});

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function productInterval(env: AppBindings, productId: string): BillingInterval | null {
  const products = getBillingCatalog(env).revenueCat.products;
  if (productId === products.ios.monthly || productId === products.android.monthly) {
    return "monthly";
  }
  if (productId === products.ios.yearly || productId === products.android.yearly) {
    return "yearly";
  }
  return null;
}

function statusFor(
  expiresAt: Date | null,
  gracePeriodExpiresAt: Date | null,
  hasBillingIssue: boolean,
): GrantStatus {
  const now = Date.now();
  if (hasBillingIssue && gracePeriodExpiresAt && gracePeriodExpiresAt.getTime() > now) {
    return "grace_period";
  }
  if (!expiresAt || expiresAt.getTime() > now) {
    return "active";
  }
  return "expired";
}

export async function retrieveRevenueCatGrants(
  env: AppBindings,
  userId: string,
): Promise<NormalizedProviderGrant[]> {
  if (!env.REVENUECAT_SECRET_API_KEY) {
    throw new Error("REVENUECAT_SECRET_API_KEY must be set");
  }

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`RevenueCat reconciliation failed with status ${response.status}`);
  }

  const parsed = subscriberResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("RevenueCat returned an invalid subscriber response");
  }

  const grants: NormalizedProviderGrant[] = [];
  for (const [productId, value] of Object.entries(parsed.data.subscriber.subscriptions)) {
    const interval = productInterval(env, productId);
    if (!interval) {
      continue;
    }
    const providerEnvironment: ProviderEnvironment = value.is_sandbox ? "sandbox" : "production";
    const expiresAt = parseDate(value.expires_date);
    const occurredAt =
      parseDate(value.purchase_date) ?? parseDate(value.original_purchase_date) ?? new Date();
    grants.push({
      provider: "revenuecat",
      providerEnvironment,
      providerCustomerId: userId,
      providerGrantId:
        value.store_transaction_id ??
        `${userId}:${productId}:${value.original_purchase_date ?? "unknown"}`,
      userId,
      productId,
      interval,
      status: statusFor(
        expiresAt,
        parseDate(value.grace_period_expires_date),
        Boolean(value.billing_issues_detected_at),
      ),
      occurredAt,
      expiresAt,
      managementUrl: parsed.data.subscriber.management_url ?? null,
      lastProviderState: value.billing_issues_detected_at ? "BILLING_ISSUE" : "SUBSCRIBER_SNAPSHOT",
    });
  }
  return grants;
}
