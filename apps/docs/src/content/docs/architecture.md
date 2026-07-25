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
