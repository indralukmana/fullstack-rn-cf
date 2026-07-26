---
title: Billing operations
description: Alerts, abuse controls, privacy lifecycle, support, and incident recovery
---

Billing operations must preserve provider authority. Support may request reconciliation or replay a
durable event, but must not directly toggle grants or aggregate entitlements.

## Edge and webhook controls

Webhook routes bypass the generic customer limiter so legitimate provider bursts are not rejected.
They have a separate isolate-local backstop configured by `WEBHOOK_RATE_LIMIT_TTL` and
`WEBHOOK_RATE_LIMIT_MAX`; this is not a global security boundary.

Before production, create Cloudflare edge rules scoped to `/api/webhooks/stripe` and
`/api/webhooks/revenuecat`:

- allow only `POST` with a one-megabyte maximum body;
- apply a dedicated high burst limit, independent of login/customer traffic;
- retain signature/authorization verification in the Worker—IP allowlists are only defense in
  depth because provider ranges can change;
- alert on sustained `401`, `400`, `429`, and `5xx` rates without logging secrets or payloads.

## Observability and alerts

Workers Logs and traces are enabled at 10% head sampling. Every HTTP response carries
`X-Request-Id`; logs contain request ID, method, route, status, and duration. Billing processor
logs contain only event ID, provider, type, attempt, duration, and redacted error—never webhook
payloads, customer email, receipts, authorization headers, or Stripe/RevenueCat keys.

Create these alerts before launch:

| Signal                       | Initial threshold                | Response                                           |
| ---------------------------- | -------------------------------- | -------------------------------------------------- |
| Billing Queue oldest message | > 5 minutes                      | Check provider/API health and failed D1 events     |
| Billing Queue backlog        | > 100 messages for 10 minutes    | Pause launches; inspect consumer errors            |
| DLQ messages                 | Any                              | Correct cause, then replay from durable event IDs  |
| `billing_event_failed`       | 5 in 10 minutes                  | Check catalog, identity, credentials, and provider |
| Reconciliation failure       | 3 consecutive runs               | Check provider API status and secret validity      |
| Worker `5xx`                 | > 1% for 5 minutes               | Correlate request IDs and roll back recent release |
| D1/Queues/Workers spend      | 50%, 80%, 100% of monthly budget | Investigate abuse and traffic growth               |
| Stripe disputes/refunds      | Any unusual increase             | Review fraud, product messaging, and support       |

Queue backlog metrics are available in the Cloudflare dashboard/API. Budget thresholds and paging
destinations are account-specific and intentionally not hardcoded. Test every notification route
with a synthetic alert before accepting payments.

## Support workflow

1. Confirm the authenticated user ID; never search or mutate by email alone.
2. Read provider customers, subscriptions, grants, aggregate entitlement, and recent billing
   events. Do not expose webhook payloads to general support roles.
3. Compare the state with Stripe or RevenueCat.
4. Request audited reconciliation through `POST /api/billing/reconcile`.
5. If an event is failed, correct the cause and re-enqueue its opaque D1 event ID. Record the
   incident ticket in the operational system.
6. Escalate transfers, refunds, chargebacks, or identity conflicts; do not grant permanent access
   as a shortcut.

`billing_audit` records customer reconciliation requests, privacy exports, blocked deletions, and
completed deletions. Restrict D1 access and define an organization-specific audit retention period.

## Privacy export and deletion

`GET /api/account/export` returns account, membership, and normalized billing-grant data and audits
the request. It deliberately excludes credentials, sessions, webhook payloads, provider secrets,
and raw receipts.

`DELETE /api/account` requires a verified session and exact `{"confirmation":"DELETE"}`. Active
or grace-period subscriptions block deletion and return platform-neutral management guidance.
This prevents the app from claiming that local deletion canceled Apple, Google, or Stripe billing.
After subscriptions expire, deletion atomically removes local account and billing projections
while retaining a minimal audit record. Adapt the policy to jurisdictional requirements and
document any lawful audit-retention basis before production.

## Incident recovery

- Invalid deployment: roll back the Worker/EAS release; do not reverse D1 migrations blindly.
- Provider outage: leave durable events retryable and preserve existing unexpired grants.
- Bad catalog deployment: restore the previous config, replay failed events, then reconcile active
  customers.
- Queue failure: scheduled recovery re-enqueues durable received/failed rows; inspect the DLQ.
- Suspected secret leak: rotate provider/webhook secrets, deploy, verify test events, then revoke
  old credentials.
- Data mismatch: retrieve provider authority and reconcile. Direct SQL entitlement edits are not
  a supported recovery mechanism.
