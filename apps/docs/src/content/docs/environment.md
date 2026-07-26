---
title: Environment configuration
description: Varlock schemas, local overrides, Expo builds, and Worker deployment
---

Varlock is the only environment loader. Do not add `dotenv`, `.dev.vars`, or framework-specific
env loading alongside it.

## File model

Each deployable workspace owns a committed `.env.schema`. It is the source of truth for names,
types, validation, sensitivity, documentation, and safe non-secret defaults. Local and
environment-specific values use Varlock's increasing precedence:

1. `.env.schema`
2. `.env` (supported by Varlock, but deliberately not used here)
3. `.env.local`
4. `.env.[environment]`
5. `.env.[environment].local`
6. process environment overrides

Only `.env.schema` is committed. Every `.env*` override is ignored. Prefer `.env.local` for
machine-specific development values and `.env.[environment].local` only for local simulations.
Use protected CI/EAS variables or Varlock secret-provider functions for shared deployments.

`pnpm setup` migrates a legacy `.env` to `.env.local`. On a fresh checkout it creates only an API
development auth secret; all other local values come from safe schema defaults.

## Validate and generate types

Run from the relevant workspace:

```bash
pnpm --filter @rn-cf/api exec varlock load
pnpm --filter @rn-cf/app exec varlock load
pnpm env:codegen
```

`varlock load` displays a redacted resolved configuration and reports missing or invalid values.
Generated `env.d.ts` files provide typed `ENV` access and are checked for drift in CI.

## Expo and React Native

The Babel plugin and `withVarlockMetroConfig` load and validate config when Metro starts.
Application code reads `ENV` from `varlock/env`. Non-sensitive values are compiled into the
JavaScript bundle and are publicly recoverable; native code must never reference an item marked
`@sensitive`.

For an Android emulator, override host URLs for that command without changing shared defaults:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8787 \
EXPO_PUBLIC_APP_URL=http://10.0.2.2:8081 \
pnpm dev:android
```

For a physical device, use the development machine's LAN IP and expose the API on `0.0.0.0`.
Public RevenueCat SDK keys belong in the EAS environment for preview/production builds. Stripe and
RevenueCat secret keys belong only to the API.

Restart Metro after changing any value because Expo public config is resolved at bundle time.

## Cloudflare Workers

`varlock-wrangler dev` resolves the API schema and local overrides, injects them into Miniflare,
and restarts when env files change. `varlock-wrangler deploy` uploads non-sensitive values as
Worker vars and sensitive values as secret bindings.

The deploy operation treats the schema as authoritative: manually configured Worker vars or
secrets absent from `.env.schema` can be removed on the next deployment. D1, Queue, Email, and
other resource bindings remain in `wrangler.toml`.
