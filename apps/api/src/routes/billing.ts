import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  BillingStatusResponseSchema,
  BillingUrlResponseSchema,
  CreateCheckoutRequestSchema,
  ErrorResponseSchema,
  ReconciliationResponseSchema,
} from "@rn-cf/types";
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import Stripe from "stripe";

import type { AppEnv } from "../app-env";

import { createDb } from "../db/client";
import {
  billingAudit,
  billingCustomer,
  entitlement,
  providerGrant,
  purchaseAttempt,
} from "../db/schema";
import { getBillingCatalog } from "../lib/billing/catalog";
import { reconcileBillingCustomer } from "../lib/billing/reconcile-customer";
import { getRuntimeConfig } from "../lib/config";
import { requireAuth } from "../middleware/require-auth";
import { requireVerifiedAuth } from "../middleware/require-verified-auth";

const errorResponses = {
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
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { "application/json": { schema: BillingStatusResponseSchema } },
      description: "Server-authoritative personal entitlement and provider grants",
    },
    ...errorResponses,
  },
});

billingRoutes.openapi(statusRoute, async (c) => {
  const db = createDb(c.env.DB);
  const config = getRuntimeConfig(c.env);
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const [aggregate, grants] = await Promise.all([
    db.query.entitlement.findFirst({
      where: and(
        eq(entitlement.subjectType, "user"),
        eq(entitlement.subjectId, c.var.user.id),
        eq(entitlement.key, config.billingEntitlementKey),
      ),
    }),
    db.query.providerGrant.findMany({
      where: and(
        eq(providerGrant.subjectType, "user"),
        eq(providerGrant.subjectId, c.var.user.id),
        eq(providerGrant.entitlementKey, config.billingEntitlementKey),
        eq(providerGrant.providerEnvironment, providerEnvironment),
      ),
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
  middleware: [requireAuth, requireVerifiedAuth] as const,
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
  const db = createDb(c.env.DB);
  const config = getRuntimeConfig(c.env);
  const catalog = getBillingCatalog(c.env);
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const now = new Date();
  await db
    .update(purchaseAttempt)
    .set({ state: "expired", updatedAt: now })
    .where(
      and(
        eq(purchaseAttempt.userId, c.var.user.id),
        eq(purchaseAttempt.state, "pending"),
        lt(purchaseAttempt.expiresAt, now),
      ),
    );

  const activeGrant = await db.query.providerGrant.findFirst({
    where: and(
      eq(providerGrant.subjectType, "user"),
      eq(providerGrant.subjectId, c.var.user.id),
      eq(providerGrant.entitlementKey, catalog.entitlementKey),
      eq(providerGrant.providerEnvironment, providerEnvironment),
      inArray(providerGrant.status, ["active", "grace_period"]),
      or(isNull(providerGrant.expiresAt), gt(providerGrant.expiresAt, now)),
    ),
    columns: { provider: true },
  });
  if (activeGrant) {
    return c.json(
      {
        error: "subscription_exists",
        message: `Manage the existing ${activeGrant.provider} subscription instead`,
      },
      409,
    );
  }

  const stripe = stripeClient(c.env.STRIPE_SECRET_KEY);
  const pending = await db.query.purchaseAttempt.findFirst({
    where: and(
      eq(purchaseAttempt.userId, c.var.user.id),
      eq(purchaseAttempt.state, "pending"),
      gt(purchaseAttempt.expiresAt, now),
    ),
  });
  if (pending?.providerSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(pending.providerSessionId);
    if (existingSession.url) {
      return c.json({ url: existingSession.url }, 200);
    }
  }
  if (pending) {
    return c.json(
      { error: "purchase_pending", message: "A subscription purchase is already pending" },
      409,
    );
  }

  let customer = await db.query.billingCustomer.findFirst({
    where: and(
      eq(billingCustomer.subjectType, "user"),
      eq(billingCustomer.subjectId, c.var.user.id),
      eq(billingCustomer.provider, "stripe"),
    ),
  });
  if (!customer) {
    const stripeCustomer = await stripe.customers.create(
      {
        email: c.var.user.email,
        metadata: { userId: c.var.user.id },
      },
      { idempotencyKey: `billing-customer:${c.var.user.id}` },
    );
    [customer] = await db
      .insert(billingCustomer)
      .values({
        id: crypto.randomUUID(),
        subjectType: "user",
        subjectId: c.var.user.id,
        provider: "stripe",
        providerCustomerId: stripeCustomer.id,
      })
      .onConflictDoUpdate({
        target: [billingCustomer.subjectType, billingCustomer.subjectId, billingCustomer.provider],
        set: { providerCustomerId: stripeCustomer.id, updatedAt: now },
      })
      .returning();
  }
  if (!customer) {
    throw new Error("Could not create Stripe customer");
  }

  const attemptId = crypto.randomUUID();
  const idempotencyKey = `checkout:${attemptId}`;
  await db.insert(purchaseAttempt).values({
    id: attemptId,
    userId: c.var.user.id,
    provider: "stripe",
    providerEnvironment,
    interval,
    idempotencyKey,
    expiresAt: new Date(now.getTime() + 30 * 60_000),
  });
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customer.providerCustomerId,
        client_reference_id: c.var.user.id,
        line_items: [{ price: catalog.stripe[interval], quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${config.appUrl}/me?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.appUrl}/me?checkout=canceled`,
        metadata: { userId: c.var.user.id, interval, purchaseAttemptId: attemptId },
        subscription_data: { metadata: { userId: c.var.user.id } },
      },
      { idempotencyKey },
    );
    if (!session.url) {
      throw new Error("Stripe Checkout did not return a URL");
    }
    await db
      .update(purchaseAttempt)
      .set({ providerSessionId: session.id, updatedAt: new Date() })
      .where(eq(purchaseAttempt.id, attemptId));
    return c.json({ url: session.url }, 200);
  } catch (error) {
    await db
      .update(purchaseAttempt)
      .set({ state: "failed", updatedAt: new Date() })
      .where(eq(purchaseAttempt.id, attemptId));
    throw error;
  }
});

const portalRoute = createRoute({
  method: "post",
  path: "/portal",
  operationId: "createStripePortal",
  tags: ["Billing"],
  middleware: [requireAuth, requireVerifiedAuth] as const,
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
    where: and(
      eq(billingCustomer.subjectType, "user"),
      eq(billingCustomer.subjectId, c.var.user.id),
      eq(billingCustomer.provider, "stripe"),
    ),
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
  middleware: [requireAuth, requireVerifiedAuth] as const,
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
  const stripeCustomer = await db.query.billingCustomer.findFirst({
    where: and(
      eq(billingCustomer.subjectType, "user"),
      eq(billingCustomer.subjectId, c.var.user.id),
      eq(billingCustomer.provider, "stripe"),
    ),
  });
  const targets = [
    {
      subjectType: "user" as const,
      subjectId: c.var.user.id,
      provider: "revenuecat" as const,
      providerCustomerId: c.var.user.id,
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
