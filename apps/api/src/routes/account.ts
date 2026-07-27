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
import { deleteAccount } from "../lib/account/delete-account";
import { getRuntimeConfig } from "../lib/config";
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
  const result = await deleteAccount(createDb(c.env.DB), c.env.DB, c.env, {
    userId: c.var.user.id,
    requestId: c.var.requestId,
  });
  if (result.status === "blocked") {
    return c.json({ error: result.error, message: result.message }, 409);
  }
  return c.json({ deleted: true as const }, 200);
});
