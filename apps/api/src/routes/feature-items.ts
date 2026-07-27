import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  CreateFeatureItemRequestSchema,
  ErrorResponseSchema,
  FeatureItemListResponseSchema,
  FeatureItemSchema,
  FeatureKeySchema,
} from "@rn-cf/types";
import { and, desc, eq } from "drizzle-orm";

import type { AppEnv } from "../app-env";

import { createDb } from "../db/client";
import { featureItem } from "../db/schema";
import { requireAuth } from "../middleware/require-auth";
import { requireOrganization } from "../middleware/require-organization";

const errorResponses = {
  400: {
    content: { "application/json": { schema: ErrorResponseSchema } },
    description: "Organization required",
  },
  401: {
    content: { "application/json": { schema: ErrorResponseSchema } },
    description: "Authentication required",
  },
  403: {
    content: { "application/json": { schema: ErrorResponseSchema } },
    description: "Not a member of this organization",
  },
} as const;

const FeatureKeyParamsSchema = z.object({
  featureKey: FeatureKeySchema,
});

function serializeItem(row: typeof featureItem.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    featureKey: row.featureKey,
    title: row.title,
    body: row.body ?? null,
    createdByUserId: row.createdByUserId,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export const featureItemRoutes = new OpenAPIHono<AppEnv>();

const listRoute = createRoute({
  method: "get",
  path: "/{featureKey}/items",
  operationId: "listFeatureItems",
  tags: ["Features"],
  middleware: [requireAuth, requireOrganization] as const,
  request: {
    params: FeatureKeyParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: FeatureItemListResponseSchema } },
      description: "Organization-scoped feature items",
    },
    ...errorResponses,
  },
});

const createItemRoute = createRoute({
  method: "post",
  path: "/{featureKey}/items",
  operationId: "createFeatureItem",
  tags: ["Features"],
  middleware: [requireAuth, requireOrganization] as const,
  request: {
    params: FeatureKeyParamsSchema,
    body: {
      content: { "application/json": { schema: CreateFeatureItemRequestSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: FeatureItemSchema } },
      description: "Created feature item",
    },
    ...errorResponses,
  },
});

featureItemRoutes.openapi(listRoute, async (c) => {
  const { featureKey } = c.req.valid("param");
  const db = createDb(c.env.DB);
  const rows = await db
    .select()
    .from(featureItem)
    .where(
      and(
        eq(featureItem.organizationId, c.var.organization.id),
        eq(featureItem.featureKey, featureKey),
      ),
    )
    .orderBy(desc(featureItem.createdAt))
    .all();

  return c.json({ items: rows.map(serializeItem) }, 200);
});

featureItemRoutes.openapi(createItemRoute, async (c) => {
  const { featureKey } = c.req.valid("param");
  const body = c.req.valid("json");
  const db = createDb(c.env.DB);
  const id = crypto.randomUUID();
  const createdAt = new Date();
  const normalizedBody = body.body?.trim() ? body.body.trim() : null;

  const row = {
    id,
    organizationId: c.var.organization.id,
    featureKey,
    title: body.title,
    body: normalizedBody,
    createdByUserId: c.var.user.id,
    createdAt,
  };

  await db.insert(featureItem).values(row);
  return c.json(serializeItem(row), 201);
});
