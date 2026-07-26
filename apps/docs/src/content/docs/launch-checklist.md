---
title: Launch checklist
description: Required technical, billing, store, and operational gates
---

Do not accept production payments until every applicable item is verified. Repository checks prove
code behavior; they cannot prove ownership, store agreements, products, credentials, or live
provider configuration.

## Automated gates

Run from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm release:check
pnpm peers check
```

`release:check` enforces formatting, lint, workspace types, API and web tests, generated OpenAPI and
environment drift, fresh-database migration integrity, and the Expo web production export. GitLab
runs generated drift, migration validation, Expo config validation, API tests, Playwright, and
builds as separate reviewable jobs.

## Billing configuration

- [ ] Production config validation passes with HTTPS URLs, Cloudflare Email, Queue, and all billing
      identifiers/secrets.
- [ ] Stripe monthly/yearly prices are live-mode recurring prices and Checkout/Portal branding,
      tax, receipts, cancellation, dispute, and refund behavior are reviewed.
- [ ] RevenueCat iOS/Android apps, `pro` entitlement, default offering, monthly/yearly products,
      restore/transfer policy, webhooks, App Store notifications, and Google RTDN are configured.
- [ ] Test events project only known users, products, apps, and environments.
- [ ] Dual-provider access, cancellation, grace, refund, expiration, restore, transfer, duplicate,
      out-of-order, replay, and reconciliation behavior is verified.

## Native stores

- [ ] Final package/bundle IDs, names, icons, screenshots, descriptions, categories, age ratings,
      privacy URLs, support URLs, and subscription disclosures are complete.
- [ ] Apple and Google agreements, tax, banking, signing, API credentials, test users, and review
      notes are complete.
- [ ] The real-device matrix in the native release runbook passes on Apple Sandbox/TestFlight and
      Google internal testing.
- [ ] App Privacy, privacy manifest, Google Data Safety, account deletion, restore, and management
      links match actual behavior.
- [ ] Store production promotion remains manual, staged, and observed.

## Operations

- [ ] Cloudflare webhook edge rules and dedicated rate controls are active.
- [ ] Queue backlog/age, DLQ, billing failures, reconciliation, Worker errors, disputes, and spend
      alerts have been test-fired to the real escalation destination.
- [ ] On-call owners can correlate request/event IDs, replay failed events, reconcile customers,
      rotate secrets, roll back Worker/EAS updates, and halt store rollout.
- [ ] Webhook payload, billing audit, account export, deletion, backup, and retention policies have
      legal/business approval.
- [ ] Support can inspect provider source/status without direct entitlement mutation.

## Go/no-go

Record release commit, migration set, Worker version, native build IDs, EAS runtime fingerprint,
store versions, catalog IDs, alert test evidence, known risks, approver, rollout percentage, and
rollback owner in the release ticket. Any unchecked payment, identity, migration, privacy, or
rollback item is a no-go.
