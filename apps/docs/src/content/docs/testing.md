---
title: Testing
description: Unit, integration, and e2e checks
---

```bash
pnpm test          # workspace tests (API vitest)
pnpm test:e2e      # Playwright against Expo web + API
pnpm typecheck
pnpm lint:check
pnpm codegen:check
pnpm env:check
pnpm migrations:check
pnpm release:check  # full clean-tree launch gate
```

Billing tests cover authenticated webhook receipt, durable deduplication, authoritative provider
projection, dual-provider OR access, sandbox isolation, restore/refund/grace/expiry normalization,
unknown catalog/environment rejection, Queue replay, Checkout/Portal authorization, paid-route
enforcement, privacy export, and subscription-safe deletion. Playwright covers the protected web
paywall and mocked Stripe launch/return.

Native StoreKit and Play Billing cannot be proven in Node or browser CI. Complete the real-device
matrix in the native release runbook for every production candidate.
