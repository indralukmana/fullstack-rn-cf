import type { Database } from "../../db/client";
import type { AppBindings } from "../config";

import { billingAudit } from "../../db/schema";
import { getRuntimeConfig } from "../config";
import { listSoleOwnedOrganizationIds } from "../organization/lifecycle";

export type DeleteAccountInput = {
  userId: string;
  requestId: string;
};

export type DeleteAccountResult =
  | { status: "deleted" }
  | {
      status: "blocked";
      error: "active_subscription";
      message: string;
    }
  | {
      status: "blocked";
      error: "sole_owner_organization";
      message: string;
    };

async function checkActiveSubscriptionBlock(
  db: Database,
  userId: string,
  requestId: string,
  providerEnvironment: "production" | "sandbox",
): Promise<DeleteAccountResult | null> {
  const ownedMemberships = await db.query.member.findMany({
    where: {
      userId,
      role: "owner",
    },
    columns: { organizationId: true },
  });
  const ownedOrganizationIds = ownedMemberships.map((membership) => membership.organizationId);
  const activeGrants =
    ownedOrganizationIds.length > 0
      ? await db.query.providerGrant.findMany({
          where: {
            subjectType: "organization",
            subjectId: { in: ownedOrganizationIds },
            providerEnvironment,
            status: { in: ["active", "grace_period"] },
            OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gt: new Date() } }],
          },
        })
      : [];

  if (activeGrants.length === 0) {
    return null;
  }

  await db.insert(billingAudit).values({
    id: crypto.randomUUID(),
    actorUserId: userId,
    subjectUserId: userId,
    action: "account_deletion_blocked",
    metadata: {
      requestId,
      reason: "active_subscription",
      organizationIds: [...new Set(activeGrants.map((grant) => grant.subjectId))],
      providers: [...new Set(activeGrants.map((grant) => grant.provider))],
    },
  });
  return {
    status: "blocked",
    error: "active_subscription",
    message:
      "Manage active organization subscriptions with Stripe, Apple, or Google before deleting this account",
  };
}

async function checkSoleOwnerBlock(
  db: Database,
  userId: string,
  requestId: string,
): Promise<DeleteAccountResult | null> {
  const soleOwnedOrganizationIds = await listSoleOwnedOrganizationIds(db, userId);
  if (soleOwnedOrganizationIds.length === 0) {
    return null;
  }

  await db.insert(billingAudit).values({
    id: crypto.randomUUID(),
    actorUserId: userId,
    subjectUserId: userId,
    action: "account_deletion_blocked",
    metadata: {
      requestId,
      reason: "sole_owner",
      organizationIds: soleOwnedOrganizationIds,
    },
  });
  return {
    status: "blocked",
    error: "sole_owner_organization",
    message:
      "Close or transfer ownership of every organization you solely own before deleting this account",
  };
}

async function deleteAccountData(d1: D1Database, userId: string, requestId: string): Promise<void> {
  const now = Date.now();
  await d1.batch([
    d1
      .prepare(
        "INSERT INTO billing_audit (id, actor_user_id, subject_user_id, action, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        userId,
        userId,
        "account_deleted",
        JSON.stringify({ requestId }),
        now,
      ),
    d1.prepare("DELETE FROM purchase_attempt WHERE user_id = ?").bind(userId),
    d1.prepare("DELETE FROM user WHERE id = ?").bind(userId),
  ]);
}

export async function deleteAccount(
  db: Database,
  d1: D1Database,
  env: AppBindings,
  input: DeleteAccountInput,
): Promise<DeleteAccountResult> {
  const config = getRuntimeConfig(env);
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const { userId, requestId } = input;

  const activeSubscriptionBlock = await checkActiveSubscriptionBlock(
    db,
    userId,
    requestId,
    providerEnvironment,
  );
  if (activeSubscriptionBlock) {
    return activeSubscriptionBlock;
  }

  const soleOwnerBlock = await checkSoleOwnerBlock(db, userId, requestId);
  if (soleOwnerBlock) {
    return soleOwnerBlock;
  }

  await deleteAccountData(d1, userId, requestId);
  return { status: "deleted" };
}
