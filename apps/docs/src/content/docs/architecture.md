---
title: Architecture
description: High-level layout of the monorepo
---

```text
apps/api   Hono on Cloudflare Workers + D1 + Better Auth
apps/app   Expo Router (iOS / Android / web)
apps/docs  Astro Starlight
apps/e2e   Playwright against Expo web + API

packages/types       Shared Zod / OpenAPI schemas
packages/api-client  Orval-generated TanStack Query client
packages/config      Shared tsconfig presets
```

The Expo app talks to the Workers API over HTTP. Web uses cookie sessions; native uses Better Auth’s Expo client with SecureStore.

## Domain model

Shared product language lives in [Domain language](/domain/) (canonical agent file: root
`CONTEXT.md`). Forking guidance is in [Derive a product](/derive-a-product/).

**Target commercial model:** the **Organization** owns the Subscription and provider customer
identity; paid access follows the **Active Organization** Entitlement. See
[ADR 0001](/adr/0001-organization-owns-subscription/) and
[ADR 0003](/adr/0003-provider-customers-map-to-organization/).

**Current launchpad code** still keys many billing paths to the **User**. That gap is deferred
while the scaffold is polished — do not treat User-scoped billing as the long-term domain truth.
