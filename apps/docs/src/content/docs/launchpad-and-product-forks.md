---
title: Launchpad and product forks
description: Upstream template vs product repos, and how learnings should flow
---

This repo is a **launchpad** (shared scaffold). A **product** is a separate repo (or long-lived
fork) built from it. Keep that direction clear or both trees rot.

[Derive a product](/derive-a-product/) covers rename, reskin, and catalog. This page covers how
the two repos stay useful to each other.

## Roles

| Role                      | Owns                                                                               | Does not own                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Launchpad** (this repo) | Auth/email/config patterns, Organization + billing ADRs, agent harness, DX recipes | Your product screens and copy                                                 |
| **Product**               | Domain features, branding, store accounts, whether tenancy stays or goes           | Rewriting the launchpad’s ledger “just for us” without feeding fixes upstream |

Default story: **launchpad is upstream**, product is **downstream**. They are not peers with equal
merge rights into each other.

## Strategies (pick one)

### 1. Downstream fork (recommended for a real product)

Clone or fork into a private product remote. Run `pnpm productize`. Evolve the product freely.

- Sync **from launchpad → product** on a schedule or when a fix hurts (cherry-pick / patch, not
  blind `git merge` of all of `main` after you diverge hard).
- Sync **from product → launchpad** only for generic fixes (see allowlist below).

### 2. Same monorepo, second app

Add another Expo/API workspace when you will maintain launchpad and product in one PR often. Higher
day-to-day cost; best when both stay multi-tenant and share most of the Worker.

### 3. One-shot scaffold

Productize in place and stop tracking upstream. Fine for a single app. Do not pretend learnings
still flow both ways.

### 4. No multi-tenancy product

Still use strategy 1. At compose time, omit the Better Auth **organization adapter** (see
[Auth](/auth/)); keep identity (email/password + Expo). Then strip or re-scope org-gated routes,
feature-item ownership, and Organization-owned billing — that is a deliberate product change, not
`productize`. Expect **large, one-way divergence** from launchpad billing/ADRs; upstream sync
narrows to identity, email, config, client transport, and DX only.

## What should feed what

**Launchpad → product (often)**

- Identity auth, email/outbox, Varlock/fail-closed config
- `packages/api-client` mutator / codegen mechanics
- oxlint modularity, harness sensors, Maestro/Playwright recipes
- Expo native DX (`dev:android`, `native:urls`, docs)

**Product → launchpad (rarely)**

- Bugfixes in those shared paths
- Doc corrections that apply to every fork
- Not: product screens, store SKUs, “we deleted Organizations,” one-off paywalls

**Do not feed either way as a full-tree merge** once the product has removed tenancy or rewritten
billing. Cherry-pick named commits or path-scoped patches.

## Sync-safe vs product-only (rough)

| Sync-safe (candidates)                                               | Product-only                                  |
| -------------------------------------------------------------------- | --------------------------------------------- |
| `apps/api/src/lib/better-auth/identity-*`, email, config             | `apps/app/app/*` product screens              |
| `apps/app/lib/auth-identity-client.ts`, mutator, env schema patterns | Organizations UI, billing UI, catalog         |
| `scripts/` DX (setup, Maestro docs), agent harness docs              | Seed data, store credentials, EAS project ids |
| Modularity / CI sensor scripts                                       | Feature modules keyed only to your domain     |

Organization adapter files and ADR 0001–0004 stay launchpad-canonical. A no-tenancy product stops
pulling those on purpose.

## Anti-patterns

- Two “peer” remotes with no upstream — nothing reliable feeds
- Merging launchpad `main` wholesale into a product that gutted orgs
- Pushing product-only features back into the launchpad
- Using an env flag for “orgs on/off” instead of compose-time auth adapters (this launchpad composes
  org on by default; see [Auth](/auth/))

## Related

- [Derive a product](/derive-a-product/) — productize, skin, catalog
- [Auth](/auth/) — identity core vs organization adapter
- [Domain language](/domain/) — terms that diverge if you drop Organizations
- [Agent harness](/agent-harness/) — sensors worth keeping in both trees
