import { and, eq, lt } from "drizzle-orm";
import Stripe from "stripe";

import type { Database } from "../../db/client";
import type { AppBindings } from "../config";
import type { BillingInterval } from "./catalog";

import { billingCustomer, purchaseAttempt } from "../../db/schema";
import { getRuntimeConfig } from "../config";
import { getBillingCatalog } from "./catalog";

function stripeClient(secret: string | undefined): Stripe {
  if (!secret) {
    throw new Error("Stripe billing is not configured");
  }
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
}

export type CreateStripeCheckoutInput = {
  organizationId: string;
  user: { id: string; email: string };
  interval: BillingInterval;
};

export type CreateStripeCheckoutResult =
  | { status: "success"; url: string }
  | {
      status: "conflict";
      error: "subscription_exists" | "purchase_pending";
      message: string;
    };

async function expireStalePurchaseAttempts(
  db: Database,
  organizationId: string,
  now: Date,
): Promise<void> {
  await db
    .update(purchaseAttempt)
    .set({ state: "expired", updatedAt: now })
    .where(
      and(
        eq(purchaseAttempt.organizationId, organizationId),
        eq(purchaseAttempt.state, "pending"),
        lt(purchaseAttempt.expiresAt, now),
      ),
    );
}

type CheckoutEligibilityContext = {
  organizationId: string;
  entitlementKey: string;
  providerEnvironment: "production" | "sandbox";
  now: Date;
};

async function findActiveGrantConflict(
  db: Database,
  context: CheckoutEligibilityContext,
): Promise<CreateStripeCheckoutResult | null> {
  const { organizationId, entitlementKey, providerEnvironment, now } = context;
  const activeGrant = await db.query.providerGrant.findFirst({
    where: {
      subjectType: "organization",
      subjectId: organizationId,
      entitlementKey,
      providerEnvironment,
      status: { in: ["active", "grace_period"] },
      OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gt: now } }],
    },
    columns: { provider: true },
  });
  if (!activeGrant) {
    return null;
  }
  return {
    status: "conflict",
    error: "subscription_exists",
    message: `Manage the existing ${activeGrant.provider} subscription instead`,
  };
}

async function resolvePendingCheckout(
  db: Database,
  stripe: Stripe,
  organizationId: string,
  now: Date,
): Promise<CreateStripeCheckoutResult | null> {
  const pending = await db.query.purchaseAttempt.findFirst({
    where: {
      organizationId,
      state: "pending",
      expiresAt: { gt: now },
    },
  });
  if (pending?.providerSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(pending.providerSessionId);
    if (existingSession.url) {
      return { status: "success", url: existingSession.url };
    }
  }
  if (pending) {
    return {
      status: "conflict",
      error: "purchase_pending",
      message: "A subscription purchase is already pending",
    };
  }
  return null;
}

async function ensureStripeBillingCustomer(
  db: Database,
  stripe: Stripe,
  input: {
    organizationId: string;
    user: { id: string; email: string };
    now: Date;
  },
) {
  const { organizationId, user, now } = input;
  let customer = await db.query.billingCustomer.findFirst({
    where: {
      subjectType: "organization",
      subjectId: organizationId,
      provider: "stripe",
    },
  });
  if (customer) {
    return customer;
  }

  const stripeCustomer = await stripe.customers.create(
    {
      email: user.email,
      metadata: {
        organizationId,
        actorUserId: user.id,
      },
    },
    { idempotencyKey: `billing-customer:org:${organizationId}` },
  );
  [customer] = await db
    .insert(billingCustomer)
    .values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: organizationId,
      provider: "stripe",
      providerCustomerId: stripeCustomer.id,
    })
    .onConflictDoUpdate({
      target: [billingCustomer.subjectType, billingCustomer.subjectId, billingCustomer.provider],
      set: { providerCustomerId: stripeCustomer.id, updatedAt: now },
    })
    .returning();
  if (!customer) {
    throw new Error("Could not create Stripe customer");
  }
  return customer;
}

async function createCheckoutSession(
  db: Database,
  stripe: Stripe,
  input: {
    organizationId: string;
    user: { id: string; email: string };
    interval: BillingInterval;
    customerId: string;
    appUrl: string;
    priceId: string;
    providerEnvironment: "production" | "sandbox";
    now: Date;
  },
): Promise<CreateStripeCheckoutResult> {
  const { organizationId, user, interval, customerId, appUrl, priceId, providerEnvironment, now } =
    input;
  const attemptId = crypto.randomUUID();
  const idempotencyKey = `checkout:${attemptId}`;
  await db.insert(purchaseAttempt).values({
    id: attemptId,
    userId: user.id,
    organizationId,
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
        customer: customerId,
        client_reference_id: organizationId,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${appUrl}/me?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/me?checkout=canceled`,
        metadata: {
          organizationId,
          actorUserId: user.id,
          interval,
          purchaseAttemptId: attemptId,
        },
        subscription_data: {
          metadata: {
            organizationId,
            actorUserId: user.id,
          },
        },
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
    return { status: "success", url: session.url };
  } catch (error) {
    await db
      .update(purchaseAttempt)
      .set({ state: "failed", updatedAt: new Date() })
      .where(eq(purchaseAttempt.id, attemptId));
    throw error;
  }
}

export async function createStripeCheckout(
  db: Database,
  env: AppBindings,
  input: CreateStripeCheckoutInput,
): Promise<CreateStripeCheckoutResult> {
  const config = getRuntimeConfig(env);
  const catalog = getBillingCatalog(env);
  const { organizationId, user, interval } = input;
  const providerEnvironment = config.isProduction ? "production" : "sandbox";
  const now = new Date();

  await expireStalePurchaseAttempts(db, organizationId, now);

  const activeGrantConflict = await findActiveGrantConflict(db, {
    organizationId,
    entitlementKey: catalog.entitlementKey,
    providerEnvironment,
    now,
  });
  if (activeGrantConflict) {
    return activeGrantConflict;
  }

  const stripe = stripeClient(env.STRIPE_SECRET_KEY);
  const pendingResult = await resolvePendingCheckout(db, stripe, organizationId, now);
  if (pendingResult) {
    return pendingResult;
  }

  const customer = await ensureStripeBillingCustomer(db, stripe, {
    organizationId,
    user,
    now,
  });
  return createCheckoutSession(db, stripe, {
    organizationId,
    user,
    interval,
    customerId: customer.providerCustomerId,
    appUrl: config.appUrl,
    priceId: catalog.stripe[interval],
    providerEnvironment,
    now,
  });
}
