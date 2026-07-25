---
title: Billing and entitlements
description: Provider events, subscriptions, and paid-feature authorization
---

The billing core supports Stripe for web and organization commerce and RevenueCat for native
Apple/Google subscriptions. Provider SDK objects are not the authorization model.

## Data flow

1. Verify the provider webhook signature before parsing or persisting an event.
2. Insert the event into `billing_event` using `(provider, provider_event_id)` as the
   idempotency boundary.
3. Process the durable event with retry-safe domain logic.
4. Project normalized customer and subscription state.
5. Upsert one entitlement per `(subject_type, subject_id, key)`.
6. Authorize paid capabilities from the server-side entitlement projection.

The schema separates users and organizations with an explicit subject type. This allows one
person to have a personal mobile plan while belonging to organizations with independent Stripe
plans.

## Invariants

- Duplicate provider events cannot create duplicate ledger entries.
- A provider customer maps to one subject, and a subject has at most one customer per provider.
- Subscription and entitlement states are constrained at the database boundary.
- Entitlements record their source and optional source subscription.
- `active` and `grace_period` are the only states that may grant access; the domain policy must
  still consider expiration.
- Clients may display store state but cannot grant server capabilities.
- Webhook payloads are sensitive operational data. Never log them or return them from customer
  APIs, and define a retention policy before production.
