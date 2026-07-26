import { and, eq, notInArray } from "drizzle-orm";

import type { Database } from "../../db/client";
import type { NormalizedProviderGrant, ProviderEnvironment } from "./providers/types";

import { billingCustomer, providerGrant, subscription, user } from "../../db/schema";
import { recomputeEntitlement } from "./recompute-entitlement";

type ProjectProviderGrantsInput = {
  userId: string;
  provider: "stripe" | "revenuecat";
  providerEnvironment: ProviderEnvironment;
  entitlementKey: string;
  grants: NormalizedProviderGrant[];
  completeSnapshot: boolean;
};

function subscriptionStatus(grant: NormalizedProviderGrant) {
  switch (grant.status) {
    case "active":
      return "active" as const;
    case "grace_period":
      return "past_due" as const;
    case "expired":
      return "expired" as const;
    case "revoked":
      return "canceled" as const;
    default:
      return "incomplete" as const;
  }
}

export async function projectProviderGrants(
  db: Database,
  input: ProjectProviderGrantsInput,
): Promise<void> {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, input.userId),
    columns: { id: true },
  });
  if (!existingUser) {
    throw new Error("Billing event references an unknown user");
  }

  const projectedIds: string[] = [];
  /* eslint-disable no-await-in-loop -- each grant projection preserves customer/subscription order */
  for (const grant of input.grants) {
    if (
      grant.userId !== input.userId ||
      grant.provider !== input.provider ||
      grant.providerEnvironment !== input.providerEnvironment
    ) {
      throw new Error("Provider grant does not match its projection boundary");
    }

    const [customer] = await db
      .insert(billingCustomer)
      .values({
        id: crypto.randomUUID(),
        subjectType: "user",
        subjectId: input.userId,
        provider: input.provider,
        providerCustomerId: grant.providerCustomerId,
      })
      .onConflictDoUpdate({
        target: [billingCustomer.subjectType, billingCustomer.subjectId, billingCustomer.provider],
        set: {
          providerCustomerId: grant.providerCustomerId,
          updatedAt: new Date(),
        },
      })
      .returning({ id: billingCustomer.id });
    if (!customer) {
      throw new Error("Could not project billing customer");
    }

    const [projectedSubscription] = await db
      .insert(subscription)
      .values({
        id: crypto.randomUUID(),
        billingCustomerId: customer.id,
        providerSubscriptionId: grant.providerGrantId,
        providerEnvironment: grant.providerEnvironment,
        productId: grant.productId,
        priceId: grant.priceId,
        interval: grant.interval,
        status: subscriptionStatus(grant),
        currentPeriodEndsAt: grant.expiresAt,
        managementUrl: grant.managementUrl,
        lastProviderState: grant.lastProviderState,
        lastAppliedAt: grant.occurredAt,
        cancelAtPeriodEnd: grant.status === "revoked",
      })
      .onConflictDoUpdate({
        target: [subscription.billingCustomerId, subscription.providerSubscriptionId],
        set: {
          providerEnvironment: grant.providerEnvironment,
          productId: grant.productId,
          priceId: grant.priceId,
          interval: grant.interval,
          status: subscriptionStatus(grant),
          currentPeriodEndsAt: grant.expiresAt,
          managementUrl: grant.managementUrl,
          lastProviderState: grant.lastProviderState,
          lastAppliedAt: grant.occurredAt,
          cancelAtPeriodEnd: grant.status === "revoked",
          updatedAt: new Date(),
        },
      })
      .returning({ id: subscription.id });
    if (!projectedSubscription) {
      throw new Error("Could not project subscription");
    }

    const [projected] = await db
      .insert(providerGrant)
      .values({
        id: crypto.randomUUID(),
        subjectType: "user",
        subjectId: input.userId,
        entitlementKey: input.entitlementKey,
        provider: grant.provider,
        providerEnvironment: grant.providerEnvironment,
        providerGrantId: grant.providerGrantId,
        billingCustomerId: customer.id,
        subscriptionId: projectedSubscription.id,
        productId: grant.productId,
        interval: grant.interval,
        status: grant.status,
        occurredAt: grant.occurredAt,
        expiresAt: grant.expiresAt,
        managementUrl: grant.managementUrl,
        lastProviderState: grant.lastProviderState,
      })
      .onConflictDoUpdate({
        target: [
          providerGrant.provider,
          providerGrant.providerEnvironment,
          providerGrant.providerGrantId,
          providerGrant.entitlementKey,
        ],
        set: {
          subjectType: "user",
          subjectId: input.userId,
          billingCustomerId: customer.id,
          subscriptionId: projectedSubscription.id,
          productId: grant.productId,
          interval: grant.interval,
          status: grant.status,
          occurredAt: grant.occurredAt,
          expiresAt: grant.expiresAt,
          managementUrl: grant.managementUrl,
          lastProviderState: grant.lastProviderState,
          updatedAt: new Date(),
        },
      })
      .returning({ id: providerGrant.id });
    if (projected) {
      projectedIds.push(projected.id);
    }
  }
  /* eslint-enable no-await-in-loop */

  if (input.completeSnapshot) {
    const boundary = and(
      eq(providerGrant.subjectType, "user"),
      eq(providerGrant.subjectId, input.userId),
      eq(providerGrant.entitlementKey, input.entitlementKey),
      eq(providerGrant.provider, input.provider),
      eq(providerGrant.providerEnvironment, input.providerEnvironment),
    );
    await db
      .update(providerGrant)
      .set({
        status: "expired",
        lastProviderState: "missing_from_authoritative_snapshot",
        updatedAt: new Date(),
      })
      .where(
        projectedIds.length > 0
          ? and(boundary, notInArray(providerGrant.id, projectedIds))
          : boundary,
      );
  }

  await recomputeEntitlement(db, {
    subjectType: "user",
    subjectId: input.userId,
    entitlementKey: input.entitlementKey,
    providerEnvironment: input.providerEnvironment,
  });
}
