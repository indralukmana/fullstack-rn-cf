import { APIError } from "better-auth";

import type { Database } from "../../db/client";
import type { AppBindings } from "../config";

import { createDb } from "../../db/client";
import { getRuntimeConfig } from "../config";

export type OrganizationLifecycleEnv = AppBindings & {
  DB: D1Database;
};

export async function organizationHasActiveSubscription(
  db: Database,
  env: AppBindings,
  organizationId: string,
): Promise<boolean> {
  const config = getRuntimeConfig(env);
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const activeGrant = await db.query.providerGrant.findFirst({
    where: {
      subjectType: "organization",
      subjectId: organizationId,
      providerEnvironment,
      status: { in: ["active", "grace_period"] },
      OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gt: new Date() } }],
    },
    columns: { id: true },
  });
  return Boolean(activeGrant);
}

/**
 * ADR 0004: do not hard-close an Organization over live billing.
 */
export async function assertOrganizationCanBeDeleted(
  env: OrganizationLifecycleEnv,
  organizationId: string,
): Promise<void> {
  const db = createDb(env.DB);
  if (await organizationHasActiveSubscription(db, env, organizationId)) {
    throw new APIError("BAD_REQUEST", {
      message: "Cancel or expire the organization subscription before closing this organization",
      code: "ORGANIZATION_HAS_ACTIVE_SUBSCRIPTION",
    });
  }
}

/**
 * Organizations where this user is the only owner (must close or transfer before account delete).
 */
export async function listSoleOwnedOrganizationIds(
  db: Database,
  userId: string,
): Promise<string[]> {
  const owned = await db.query.member.findMany({
    where: { userId, role: "owner" },
    columns: { organizationId: true },
  });
  if (owned.length === 0) {
    return [];
  }

  const soleOwned: string[] = [];
  /* eslint-disable no-await-in-loop -- each org needs its own owner count */
  for (const membership of owned) {
    const owners = await db.query.member.findMany({
      where: {
        organizationId: membership.organizationId,
        role: "owner",
      },
      columns: { id: true },
    });
    if (owners.length <= 1) {
      soleOwned.push(membership.organizationId);
    }
  }
  /* eslint-enable no-await-in-loop */
  return soleOwned;
}
