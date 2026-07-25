---
title: Auth
description: Better Auth on Workers + Expo
---

Email/password auth is enabled via Better Auth on the Workers API.

- Server plugin: `@better-auth/expo`
- Client: `better-auth/react` + `@better-auth/expo/client`
- Trusted origins: `CORS_ORIGINS` + `TRUSTED_ORIGINS` + native `rn-cf://` / `exp://`
- Secrets and URLs: validated by varlock (`apps/api/.env.schema`)

## Email verification

Sign-up requires email verification before sign-in (`requireEmailVerification: true`).

- Verification + password-reset emails are sent through `apps/api/src/lib/email/send.ts`
- Default provider: `EMAIL_PROVIDER=console` (logs + stores messages)
- Production provider: `EMAIL_PROVIDER=cloudflare` through the `EMAIL` Workers binding
- Cloudflare Email Sending currently requires Workers Paid and a domain onboarded to Email Service
- Local/dev mailbox: `GET /api/dev/mailbox?to=user@example.com` (disabled in production)

App screens:

- `/check-email` — after register or forgot-password
- Resend verification from that screen

## Password reset

1. `/forgot-password` → `requestPasswordReset`
2. Open the emailed `/api/auth/reset-password/:token` link (redirects to `/reset-password?token=…`)
3. Submit a new password on `/reset-password`

Sessions are revoked on successful password reset.
