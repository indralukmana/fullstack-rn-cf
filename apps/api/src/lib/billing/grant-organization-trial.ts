import type { Database } from "../../db/client";
import type { AppBindings } from "../config";

import { entitlement } from "../../db/schema";
import { getBillingCatalog } from "./catalog";

export type GrantOrganizationTrialInput = {
  organizationId: string;
  /** Defaults to BILLING_ENTITLEMENT_KEY. */
  entitlementKey?: string;
  /** Trial length. Defaults to 14 days. */
  durationMs?: number;
  now?: Date;
};

/**
 * Time-boxed Organization Entitlement (domain Trial) without a provider Grant.
 * Survives provider recompute until it expires (see recomputeEntitlement).
 */
export async function grantOrganizationTrial(
  db: Database,
  env: AppBindings,
  input: GrantOrganizationTrialInput,
): Promise<{ created: boolean; expiresAt: Date }> {
  const now = input.now ?? new Date();
  const durationMs = input.durationMs ?? 14 * 24 * 60 * 60 * 1000;
  const entitlementKey = input.entitlementKey?.trim() || getBillingCatalog(env).entitlementKey;
  const expiresAt = new Date(now.getTime() + durationMs);

  const existing = await db.query.organization.findFirst({
    where: { id: input.organizationId },
    columns: { id: true },
  });
  if (!existing) {
    throw new Error("Trial grant references an unknown organization");
  }

  const current = await db.query.entitlement.findFirst({
    where: {
      subjectType: "organization",
      subjectId: input.organizationId,
      key: entitlementKey,
    },
  });

  const usable =
    current &&
    (current.status === "active" || current.status === "grace_period") &&
    (!current.expiresAt || current.expiresAt.getTime() > now.getTime());

  if (usable) {
    return { created: false, expiresAt: current.expiresAt ?? expiresAt };
  }

  await db
    .insert(entitlement)
    .values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: input.organizationId,
      key: entitlementKey,
      status: "active",
      source: "manual",
      expiresAt,
      computedAt: now,
    })
    .onConflictDoUpdate({
      target: [entitlement.subjectType, entitlement.subjectId, entitlement.key],
      set: {
        status: "active",
        source: "manual",
        expiresAt,
        computedAt: now,
        updatedAt: now,
      },
    });

  return { created: true, expiresAt };
}
