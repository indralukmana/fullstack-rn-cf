# Security

This starter hardens the Cloudflare Workers API with application controls and documents edge controls you should enable in Cloudflare.

## Application controls

| Control                  | Where                                                              |
| ------------------------ | ------------------------------------------------------------------ |
| Env validation & secrets | [varlock](https://varlock.dev/) `.env.schema` + `varlock-wrangler` |
| Security headers         | Hono `secureHeaders` in `apps/api/src/index.ts`                    |
| CORS allowlist           | `CORS_ORIGINS` (required in production)                            |
| Body size limit          | 1 MB via Hono `bodyLimit`                                          |
| Rate limiting            | In-isolate limiter (`RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`)           |
| Auth gate                | `requireAuth` middleware (see `GET /api/private/ping`)             |
| Email verification       | Better Auth + console/Resend mailer (`EMAIL_PROVIDER`)             |
| Password reset           | Better Auth `sendResetPassword` + app forgot/reset screens         |
| Secret leak scan         | `varlock scan` on pre-commit (lefthook)                            |

`GET /api/me` remains a soft session probe (`user: null` when signed out). Use `requireAuth` for routes that must reject anonymous callers.

## Edge controls (Cloudflare)

Prefer Cloudflare WAF / rate-limit rules for production traffic. The in-worker limiter is best-effort per isolate.

Suggested rules:

1. Path contains `/api/auth` → ~20 req / 10s per IP
2. Path starts with `/api` → ~100 req / 10s per IP
3. Enable Bot Fight Mode and Managed Ruleset (OWASP)

## Secrets

- Local: copy `apps/api/.env.example` → `apps/api/.env` (`pnpm setup`)
- Deploy: `pnpm --filter @rn-cf/api deploy` uses `varlock-wrangler`, which uploads non-sensitive values as Workers vars and sensitive values as secrets
- Never commit `.env` or `.env.keys`

## Reporting

If this repository is public, document a security contact here (email or GitLab issue template).
