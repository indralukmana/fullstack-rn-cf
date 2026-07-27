import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  AccountDeletedResponseSchema,
  AccountExportResponseSchema,
  DeleteAccountRequestSchema,
  ErrorResponseSchema,
} from "@rn-cf/types";

import type { AppEnv } from "../app-env";

import { createDb } from "../db/client";
import { billingAudit } from "../db/schema";
import { getRuntimeConfig } from "../lib/config";
import { listSoleOwnedOrganizationIds } from "../lib/organization/lifecycle";
import { requireAuth } from "../middleware/require-auth";
import { requireVerifiedAuth } from "../middleware/require-verified-auth";

export const accountRoutes = new OpenAPIHono<AppEnv>();

const exportRoute = createRoute({
  method: "get",
  path: "/export",
  operationId: "exportAccountData",
  tags: ["Account"],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { "application/json": { schema: AccountExportResponseSchema } },
      description: "Portable account, membership, and billing data",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Authentication required",
    },
  },
});

accountRoutes.openapi(exportRoute, async (c) => {
  const db = createDb(c.env.DB);
  const config = getRuntimeConfig(c.env);
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const [account, memberships] = await Promise.all([
    db.query.user.findFirst({ where: { id: c.var.user.id } }),
    db.query.member.findMany({ where: { userId: c.var.user.id } }),
  ]);
  if (!account) {
    return c.json({ error: "account_not_found", message: "Account not found" }, 401);
  }

  const organizationIds = memberships.map((membership) => membership.organizationId);
  const grants =
    organizationIds.length > 0
      ? await db.query.providerGrant.findMany({
          where: {
            subjectType: "organization",
            subjectId: { in: organizationIds },
            providerEnvironment,
          },
        })
      : [];

  await db.insert(billingAudit).values({
    id: crypto.randomUUID(),
    actorUserId: account.id,
    subjectUserId: account.id,
    action: "account_exported",
    metadata: { requestId: c.var.requestId },
  });

  return c.json(
    {
      exportedAt: new Date().toISOString(),
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt.toISOString(),
      },
      memberships: memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role:
          membership.role === "owner" || membership.role === "admin"
            ? membership.role
            : ("member" as const),
      })),
      billingGrants: grants.map((grant) => ({
        provider: grant.provider,
        productId: grant.productId,
        interval: grant.interval,
        status: grant.status,
        expiresAt: grant.expiresAt?.toISOString() ?? null,
      })),
    },
    200,
  );
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/",
  operationId: "deleteAccount",
  tags: ["Account"],
  middleware: [requireAuth, requireVerifiedAuth] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: DeleteAccountRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AccountDeletedResponseSchema } },
      description: "Local account data deleted",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Active store or Stripe subscription must be managed first",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Authentication required",
    },
    403: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Verified account required",
    },
  },
});

accountRoutes.openapi(deleteRoute, async (c) => {
  c.req.valid("json");
  const db = createDb(c.env.DB);
  const config = getRuntimeConfig(c.env);
  const providerEnvironment = config.isProduction ? "production" : "sandbox";

  const ownedMemberships = await db.query.member.findMany({
    where: {
      userId: c.var.user.id,
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

  if (activeGrants.length > 0) {
    await db.insert(billingAudit).values({
      id: crypto.randomUUID(),
      actorUserId: c.var.user.id,
      subjectUserId: c.var.user.id,
      action: "account_deletion_blocked",
      metadata: {
        requestId: c.var.requestId,
        reason: "active_subscription",
        organizationIds: [...new Set(activeGrants.map((grant) => grant.subjectId))],
        providers: [...new Set(activeGrants.map((grant) => grant.provider))],
      },
    });
    return c.json(
      {
        error: "active_subscription",
        message:
          "Manage active organization subscriptions with Stripe, Apple, or Google before deleting this account",
      },
      409,
    );
  }

  const soleOwnedOrganizationIds = await listSoleOwnedOrganizationIds(db, c.var.user.id);
  if (soleOwnedOrganizationIds.length > 0) {
    await db.insert(billingAudit).values({
      id: crypto.randomUUID(),
      actorUserId: c.var.user.id,
      subjectUserId: c.var.user.id,
      action: "account_deletion_blocked",
      metadata: {
        requestId: c.var.requestId,
        reason: "sole_owner",
        organizationIds: soleOwnedOrganizationIds,
      },
    });
    return c.json(
      {
        error: "sole_owner_organization",
        message:
          "Close or transfer ownership of every organization you solely own before deleting this account",
      },
      409,
    );
  }

  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO billing_audit (id, actor_user_id, subject_user_id, action, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(
      crypto.randomUUID(),
      c.var.user.id,
      c.var.user.id,
      "account_deleted",
      JSON.stringify({ requestId: c.var.requestId }),
      now,
    ),
    c.env.DB.prepare("DELETE FROM purchase_attempt WHERE user_id = ?").bind(c.var.user.id),
    c.env.DB.prepare("DELETE FROM user WHERE id = ?").bind(c.var.user.id),
  ]);
  return c.json({ deleted: true as const }, 200);
});
