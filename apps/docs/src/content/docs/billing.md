---
title: Billing and entitlements
description: Provider events, subscriptions, and paid-feature authorization
---

The default B2C catalog has one entitlement capability key (`pro` by default) with monthly and
yearly products. Stripe owns web checkout and RevenueCat owns native Apple/Google purchases.
Provider SDK objects are not the authorization model. Catalog key strings are not domain nouns —
see [Domain language](/domain/).

## Target vs transitional identity

**Target (ADRs):** provider customers and Subscriptions belong to the **Organization**; the User is
only the actor who checks out. Entitlement is evaluated for the **Active Organization**.

**Current code:** Better Auth's immutable `user.id` is still the RevenueCat App User ID and Stripe
metadata subject in this scaffold. That is transitional. Do not deepen User-as-payer assumptions
when deriving products that will need org-owned billing later. See
[ADR 0001](/adr/0001-organization-owns-subscription/) and
[ADR 0003](/adr/0003-provider-customers-map-to-organization/).

## Product and identity policy

- A verified account is required before any checkout or native purchase UI is shown.
- Email addresses are mutable and must never identify purchases. Until org-scoped provider identity
  ships, the launchpad uses `user.id` as the provider subject.
- Product and app identifiers are allowlisted in the server environment. Unknown products, apps,
  environments, and users fail closed instead of creating access.
- Native builds use the platform store through RevenueCat. Do not globally steer native customers
  to Stripe; only show web checkout where current App Store and Play policies permit it.
- RevenueCat restore currently uses the signed-in `user.id` (transitional). Configure the
  RevenueCat project to transfer purchases to the latest identified subject, and warn support that
  a transfer can remove access from the previous subject.
- Cancellation preserves access through the paid period. Billing issues grant only the configured
  provider grace period. Refunds, chargebacks, and expiration revoke that provider grant, but
  another active Stripe or RevenueCat grant continues to unlock the catalog entitlement key.
- Apple and Google remain responsible for native refunds and subscription cancellation. Account
  deletion must explain this and must not claim to cancel a store subscription.

## Data flow

1. Verify the provider webhook signature before parsing or persisting an event.
2. Insert the event into `billing_event` using `(provider, provider_event_id)` as the
   idempotency boundary.
3. Enqueue only the durable event ID and process it with retry-safe domain logic.
4. Project one normalized provider grant per subscription or transaction.
5. Atomically recompute one aggregate entitlement per `(subject_type, subject_id, key)`.
6. Authorize paid capabilities from the aggregate server-side entitlement.

The schema already separates subjects with `subject_type` (`user` | `organization`). The target
domain uses Organization as the commercial subject (including an Organization of one). Hybrid
user-plus-org payer modes are not the launchpad north star.

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
run through idempotent Queue processing; do not put provider reconciliation, checkout, email, or
other slow side effects on the receipt path.

## Queue recovery and reconciliation

Create `rn-cf-billing-events` and `rn-cf-billing-events-dlq` before deploying the Worker. The
consumer retries failures five times before dead-lettering. Every ten minutes, scheduled
maintenance re-enqueues durable `received` or retryable `failed` rows, reconciles recently active
provider customers, and deletes processed/failed payloads beyond
`BILLING_EVENT_RETENTION_DAYS`.

The D1 event ledger is the replay control plane: support can correct configuration or provider
availability and re-enqueue a failed event ID without replaying an unauthenticated payload. Queue
messages contain only that opaque ID. Inspect `billing_event.attempts` and `last_error` before a
replay; never edit grants or aggregate entitlements directly.

## Customer API

All purchase endpoints require an authenticated, verified account:

- `GET /api/billing/status` returns the aggregate `pro` decision and provider grants.
- `POST /api/billing/checkout` accepts only `monthly` or `yearly` and returns a Stripe Checkout
  URL on web.
- `POST /api/billing/portal` returns Stripe's hosted management URL.
- `POST /api/billing/reconcile` requests an authoritative provider refresh.

Checkout reuses one Stripe Customer per Better Auth user, sets immutable `user.id` metadata,
enforces one pending attempt, and uses the persisted attempt ID as Stripe's idempotency key.
Existing active/grace grants block a second checkout. Customer apps must authorize from the
status endpoint; `requireEntitlement("pro")` is the matching server middleware for paid routes.

## Universal app behavior

`/subscription` is account-protected and never renders purchase controls for an unverified user.
Web launches Stripe Checkout or Portal from server-issued URLs. Native builds configure
RevenueCat only after authentication with Better Auth `user.id`, load monthly/yearly packages
from the configured offering, expose user-initiated restore, and use RevenueCat Customer Center
for management.

After purchase or restore, the app requests reconciliation and refreshes
`GET /api/billing/status`. Local RevenueCat `CustomerInfo` can improve feedback but never unlocks
paid UI or APIs. Signing out clears the RevenueCat identity. Native purchase testing requires an
Expo development build; Expo Go's RevenueCat UI is preview-only and cannot complete real store
transactions.
