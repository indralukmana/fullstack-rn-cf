---
title: Security
description: Hardening, varlock, and Cloudflare edge controls
---

## Varlock

Environment variables are validated by [varlock](https://varlock.dev/):

- API schema: `apps/api/.env.schema`
- App schema: `apps/app/.env.schema`
- Local API: `varlock-wrangler` (via `pnpm --filter @rn-cf/api dev`)
- Pre-commit: `varlock scan --staged`

Sensitive items (for example `BETTER_AUTH_SECRET`) must be at least 32 characters. `CORS_ORIGINS` is required when `ENVIRONMENT=production`.

## API hardening

- Security headers (`nosniff`, `DENY` framing, referrer, permissions-policy; HSTS in production)
- CORS allowlist from `CORS_ORIGINS`
- 1 MB request body limit
- Global and auth-path rate limits (in-isolate; pair with Cloudflare WAF)
- `GET /api/private/ping` demonstrates `requireAuth`
- Email verification + password reset (console mailbox locally; Cloudflare Email Service in production)

## Cloudflare WAF

Documented recommendations live in the repo root `SECURITY.md`.
