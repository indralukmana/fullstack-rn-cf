---
title: Deployment
description: Cloudflare Workers and Pages with varlock
---

1. Create D1: `pnpm --filter @rn-cf/api exec wrangler d1 create rn-cf`.
2. Set `database_id` in `apps/api/wrangler.toml`.
3. Inject production values from protected CI variables or Varlock secret-provider functions. Set
   `ENVIRONMENT=production` and every production-required item in `apps/api/.env.schema`; do not
   create or upload a shared production `.env` file.
4. Validate from the same environment with `pnpm --filter @rn-cf/api exec varlock load`.
5. Migrate remote: `pnpm --filter @rn-cf/api db:migrate:remote`.
6. Deploy API with `pnpm --filter @rn-cf/api deploy`. `varlock-wrangler` uploads non-sensitive
   values as Worker vars and sensitive values as encrypted secret bindings.
7. Set public Expo values in the EAS environment or build process, including
   `EXPO_PUBLIC_API_URL`, RevenueCat public SDK keys, entitlement, and offering. They are compiled
   into the client and are not secrets.
8. Export and deploy web: `pnpm --filter @rn-cf/app deploy`.

For a one-off local production simulation, use ignored `.env.production.local` overrides and
`ENVIRONMENT=production`; never commit that file.
