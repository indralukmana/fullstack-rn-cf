---
title: Deployment
description: Cloudflare Workers and Pages with varlock
---

1. Create D1: `pnpm --filter @rn-cf/api exec wrangler d1 create rn-cf`
2. Set `database_id` in `apps/api/wrangler.toml`
3. Fill `apps/api/.env` for production (`ENVIRONMENT=production`, real `BETTER_AUTH_SECRET`, `CORS_ORIGINS`, `BETTER_AUTH_URL`)
4. Migrate remote: `pnpm --filter @rn-cf/api db:migrate:remote`
5. Deploy API (uploads vars/secrets via varlock): `pnpm --filter @rn-cf/api deploy`
6. Set `EXPO_PUBLIC_API_URL` in `apps/app/.env` to the Worker URL
7. Export web: `pnpm --filter @rn-cf/app export:web`
8. Deploy Pages: `pnpm --filter @rn-cf/app deploy`
