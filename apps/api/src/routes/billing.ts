import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  BillingStatusResponseSchema,
  BillingUrlResponseSchema,
  CreateCheckoutRequestSchema,
  ErrorResponseSchema,
  ReconciliationResponseSchema,
} from "@rn-cf/types";
import Stripe from "stripe";

import type { AppEnv } from "../app-env";

import { createDb } from "../db/client";
import { billingAudit } from "../db/schema";
import { createStripeCheckout } from "../lib/billing/create-checkout";
import { reconcileBillingCustomer } from "../lib/billing/reconcile-customer";
import { getRuntimeConfig } from "../lib/config";
import { requireAuth } from "../middleware/require-auth";
import { requireOrganization } from "../middleware/require-organization";
import { requireOrganizationRole } from "../middleware/require-organization-role";
import { requireVerifiedAuth } from "../middleware/require-verified-auth";

const errorResponses = {
  400: {
    content: { "application/json": { schema: ErrorResponseSchema } },
    description: "Active organization required",
  },
  401: {
    content: { "application/json": { schema: ErrorResponseSchema } },
    description: "Authentication required",
  },
  403: {
    content: { "application/json": { schema: ErrorResponseSchema } },
    description: "Verified account or billing eligibility required",
  },
} as const;

function stripeClient(secret: string | undefined): Stripe {
  if (!secret) {
    throw new Error("Stripe billing is not configured");
  }
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
}

export const billingRoutes = new OpenAPIHono<AppEnv>();

const statusRoute = createRoute({
  method: "get",
  path: "/status",
  operationId: "getBillingStatus",
  tags: ["Billing"],
  middleware: [requireAuth, requireOrganization] as const,
  responses: {
    200: {
      content: { "application/json": { schema: BillingStatusResponseSchema } },
      description: "Server-authoritative organization entitlement and provider grants",
    },
    ...errorResponses,
  },
});

billingRoutes.openapi(statusRoute, async (c) => {
  const db = createDb(c.env.DB);
  const config = getRuntimeConfig(c.env);
  const organizationId = c.var.organization.id;
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const [aggregate, grants] = await Promise.all([
    db.query.entitlement.findFirst({
      where: {
        subjectType: "organization",
        subjectId: organizationId,
        key: config.billingEntitlementKey,
      },
    }),
    db.query.providerGrant.findMany({
      where: {
        subjectType: "organization",
        subjectId: organizationId,
        entitlementKey: config.billingEntitlementKey,
        providerEnvironment,
      },
    }),
  ]);
  const hasAccess =
    Boolean(aggregate) &&
    (aggregate?.status === "active" || aggregate?.status === "grace_period") &&
    (!aggregate.expiresAt || aggregate.expiresAt.getTime() > Date.now());

  return c.json(
    {
      entitlement: "pro" as const,
      hasAccess,
      status: aggregate?.status ?? ("revoked" as const),
      expiresAt: aggregate?.expiresAt?.toISOString() ?? null,
      grants: grants.map((grant) => ({
        provider: grant.provider,
        status: grant.status,
        interval: grant.interval,
        expiresAt: grant.expiresAt?.toISOString() ?? null,
        managementUrl: grant.managementUrl,
      })),
    },
    200,
  );
});

const checkoutRoute = createRoute({
  method: "post",
  path: "/checkout",
  operationId: "createStripeCheckout",
  tags: ["Billing"],
  middleware: [
    requireAuth,
    requireVerifiedAuth,
    requireOrganization,
    requireOrganizationRole("owner", "admin"),
  ] as const,
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateCheckoutRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: BillingUrlResponseSchema } },
      description: "Stripe Checkout URL",
    },
    409: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "An entitlement or purchase is already active",
    },
    ...errorResponses,
  },
});

billingRoutes.openapi(checkoutRoute, async (c) => {
  const { interval } = c.req.valid("json");
  const result = await createStripeCheckout(createDb(c.env.DB), c.env, {
    organizationId: c.var.organization.id,
    user: c.var.user,
    interval,
  });
  if (result.status === "conflict") {
    return c.json({ error: result.error, message: result.message }, 409);
  }
  return c.json({ url: result.url }, 200);
});

const portalRoute = createRoute({
  method: "post",
  path: "/portal",
  operationId: "createStripePortal",
  tags: ["Billing"],
  middleware: [
    requireAuth,
    requireVerifiedAuth,
    requireOrganization,
    requireOrganizationRole("owner", "admin"),
  ] as const,
  responses: {
    200: {
      content: { "application/json": { schema: BillingUrlResponseSchema } },
      description: "Stripe Customer Portal URL",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "No Stripe customer exists",
    },
    ...errorResponses,
  },
});

billingRoutes.openapi(portalRoute, async (c) => {
  const customer = await createDb(c.env.DB).query.billingCustomer.findFirst({
    where: {
      subjectType: "organization",
      subjectId: c.var.organization.id,
      provider: "stripe",
    },
  });
  if (!customer) {
    return c.json(
      { error: "stripe_customer_not_found", message: "No Stripe subscription exists" },
      404,
    );
  }
  const session = await stripeClient(c.env.STRIPE_SECRET_KEY).billingPortal.sessions.create({
    customer: customer.providerCustomerId,
    return_url: `${getRuntimeConfig(c.env).appUrl}/me`,
  });
  return c.json({ url: session.url }, 200);
});

const reconcileRoute = createRoute({
  method: "post",
  path: "/reconcile",
  operationId: "requestBillingReconciliation",
  tags: ["Billing"],
  middleware: [
    requireAuth,
    requireVerifiedAuth,
    requireOrganization,
    requireOrganizationRole("owner", "admin"),
  ] as const,
  responses: {
    202: {
      content: { "application/json": { schema: ReconciliationResponseSchema } },
      description: "Reconciliation accepted",
    },
    ...errorResponses,
  },
});

billingRoutes.openapi(reconcileRoute, async (c) => {
  const db = createDb(c.env.DB);
  const organizationId = c.var.organization.id;
  const stripeCustomer = await db.query.billingCustomer.findFirst({
    where: {
      subjectType: "organization",
      subjectId: organizationId,
      provider: "stripe",
    },
  });
  const targets = [
    {
      subjectType: "organization" as const,
      subjectId: organizationId,
      provider: "revenuecat" as const,
      providerCustomerId: organizationId,
    },
    ...(stripeCustomer ? [stripeCustomer] : []),
  ];
  await db.insert(billingAudit).values({
    id: crypto.randomUUID(),
    actorUserId: c.var.user.id,
    subjectUserId: c.var.user.id,
    action: "reconciliation_requested",
    metadata: {
      requestId: c.var.requestId,
      organizationId,
      providers: targets.map((target) => target.provider),
    },
  });
  c.executionCtx.waitUntil(
    Promise.all(targets.map((target) => reconcileBillingCustomer(db, c.env, target))).then(
      () => undefined,
    ),
  );
  return c.json({ accepted: true as const }, 202);
});
