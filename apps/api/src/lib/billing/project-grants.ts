import { and, eq, notInArray } from "drizzle-orm";

import type { Database } from "../../db/client";
import type { NormalizedProviderGrant, ProviderEnvironment } from "./providers/types";

import { billingCustomer, providerGrant, subscription } from "../../db/schema";
import { recomputeEntitlement } from "./recompute-entitlement";

type ProjectProviderGrantsInput = {
  organizationId: string;
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

async function upsertBillingCustomer(
  db: Database,
  organizationId: string,
  grant: NormalizedProviderGrant,
) {
  const [customer] = await db
    .insert(billingCustomer)
    .values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: organizationId,
      provider: grant.provider,
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
  return customer;
}

async function upsertSubscription(
  db: Database,
  customerId: string,
  grant: NormalizedProviderGrant,
) {
  const [projectedSubscription] = await db
    .insert(subscription)
    .values({
      id: crypto.randomUUID(),
      billingCustomerId: customerId,
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
  return projectedSubscription;
}

async function upsertProviderGrant(
  db: Database,
  input: {
    organizationId: string;
    entitlementKey: string;
    customerId: string;
    subscriptionId: string;
    grant: NormalizedProviderGrant;
  },
) {
  const { organizationId, entitlementKey, customerId, subscriptionId, grant } = input;
  const [projected] = await db
    .insert(providerGrant)
    .values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: organizationId,
      entitlementKey,
      provider: grant.provider,
      providerEnvironment: grant.providerEnvironment,
      providerGrantId: grant.providerGrantId,
      billingCustomerId: customerId,
      subscriptionId,
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
        subjectType: "organization",
        subjectId: organizationId,
        billingCustomerId: customerId,
        subscriptionId,
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
  return projected?.id;
}

async function expireMissingSnapshotGrants(
  db: Database,
  input: ProjectProviderGrantsInput,
  projectedIds: string[],
): Promise<void> {
  if (!input.completeSnapshot) {
    return;
  }
  const boundary = and(
    eq(providerGrant.subjectType, "organization"),
    eq(providerGrant.subjectId, input.organizationId),
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

export async function projectProviderGrants(
  db: Database,
  input: ProjectProviderGrantsInput,
): Promise<void> {
  const existingOrganization = await db.query.organization.findFirst({
    where: { id: input.organizationId },
    columns: { id: true },
  });
  if (!existingOrganization) {
    throw new Error("Billing event references an unknown organization");
  }

  const projectedIds: string[] = [];
  for (const grant of input.grants) {
    if (
      grant.subjectId !== input.organizationId ||
      grant.provider !== input.provider ||
      grant.providerEnvironment !== input.providerEnvironment
    ) {
      throw new Error("Provider grant does not match its projection boundary");
    }

    const customer = await upsertBillingCustomer(db, input.organizationId, grant);
    const projectedSubscription = await upsertSubscription(db, customer.id, grant);
    const projectedId = await upsertProviderGrant(db, {
      organizationId: input.organizationId,
      entitlementKey: input.entitlementKey,
      customerId: customer.id,
      subscriptionId: projectedSubscription.id,
      grant,
    });
    if (projectedId) {
      projectedIds.push(projectedId);
    }
  }

  await expireMissingSnapshotGrants(db, input, projectedIds);

  await recomputeEntitlement(db, {
    subjectType: "organization",
    subjectId: input.organizationId,
    entitlementKey: input.entitlementKey,
    providerEnvironment: input.providerEnvironment,
  });
}
