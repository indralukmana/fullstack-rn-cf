---
title: Billing and entitlements
description: Provider events, subscriptions, and paid-feature authorization
---

The default B2C catalog has one `pro` entitlement with monthly and yearly products. Stripe owns
web checkout and RevenueCat owns native Apple/Google purchases. Provider SDK objects are not the
authorization model.

## Product and identity policy

- A verified account is required before any checkout or native purchase UI is shown.
- Better Auth's immutable `user.id` is the RevenueCat App User ID and Stripe metadata subject.
  Email addresses are mutable and must never identify purchases.
- Product and app identifiers are allowlisted in the server environment. Unknown products, apps,
  environments, and users fail closed instead of creating access.
- Native builds use the platform store through RevenueCat. Do not globally steer native customers
  to Stripe; only show web checkout where current App Store and Play policies permit it.
- RevenueCat restore uses the signed-in `user.id`. Configure the RevenueCat project to transfer
  purchases to the latest identified account, and warn support that a transfer can remove access
  from the previous account.
- Cancellation preserves access through the paid period. Billing issues grant only the configured
  provider grace period. Refunds, chargebacks, and expiration revoke that provider grant, but
  another active Stripe or RevenueCat grant continues to unlock `pro`.
- Apple and Google remain responsible for native refunds and subscription cancellation. Account
  deletion must explain this and must not claim to cancel a store subscription.

## Data flow

1. Verify the provider webhook signature before parsing or persisting an event.
2. Insert the event into `billing_event` using `(provider, provider_event_id)` as the
   idempotency boundary.
3. Process the durable event with retry-safe domain logic.
4. Project one normalized provider grant per subscription or transaction.
5. Atomically recompute one aggregate entitlement per `(subject_type, subject_id, key)`.
6. Authorize paid capabilities from the aggregate server-side entitlement.

The schema separates users and organizations with an explicit subject type. This allows one
person to have a personal mobile plan while belonging to organizations with independent Stripe
plans.

## Invariants

- Duplicate provider events cannot create duplicate ledger entries.
- A provider customer maps to one subject, and a subject has at most one customer per provider.
- Subscription and entitlement states are constrained at the database boundary.
- Provider grants retain provider environment, interval, occurrence time, expiry, management URL,
  and last-applied provider state. Sandbox grants never unlock production access.
- The entitlement row is a derived cache. Access is active when any unexpired production grant is
  active, or in grace only when no active grant exists and an unexpired grace grant does.
- `active` and `grace_period` are the only states that may grant access; the domain policy must
  still consider expiration.
- Clients may display store state but cannot grant server capabilities.
- Webhook payloads are sensitive operational data. Never log them or return them from customer
  APIs, and define a retention policy before production.

## Webhook setup

Configure provider endpoints:

- Stripe: `POST /api/webhooks/stripe`
- RevenueCat: `POST /api/webhooks/revenuecat`

Production requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`REVENUECAT_WEBHOOK_AUTHORIZATION`. Store them as Worker secrets, never Wrangler plaintext vars.
Configure RevenueCat to send the exact authorization header value stored in the Worker secret.

Stripe verification uses the exact raw request body, the `Stripe-Signature` header, and Stripe's
Web Crypto provider. RevenueCat authorization is compared using fixed-length SHA-256 digests.
Invalid requests receive generic errors and are never persisted. Valid duplicates receive a
successful response with `duplicate: true`, allowing provider retries without duplicate effects.

Webhook receipt only records durable input. Projection into subscriptions and entitlements must
run through idempotent processing logic; do not put checkout, email, or other slow side effects on
the receipt path.
