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
- On the Expo `/check-email` screen, `__DEV__` builds also show a local-mailbox panel that opens
  that API URL and the latest verification or reset link

App screens:

- `/check-email` — after register or forgot-password
- Resend verification from that screen

## Password reset

1. `/forgot-password` → `requestPasswordReset`
2. Open the emailed `/api/auth/reset-password/:token` link (redirects to `/reset-password?token=…`)
3. Submit a new password on `/reset-password`

Sessions are revoked on successful password reset.

## Organizations

The Better Auth organization plugin provides organization creation, owner/admin/member roles,
memberships, invitations, and active organization sessions. Membership is always verified by the
API; a client-provided organization ID is not an authorization decision.

Invitation messages are delivered through Cloudflare Email Service and link to
`APP_URL/accept-invitation?id=...`. `APP_URL` must use HTTPS in production. Pending invitations
and organization memberships have database uniqueness constraints to prevent duplicate state
under concurrent requests.

On native, `DeepLinkHandler` maps Expo scheme URLs (via `appCallbackUrl` / `Linking.createURL`)
for `/accept-invitation`, `/reset-password`, and `/me` onto Expo Router screens. Web continues to
use ordinary HTTPS paths under `APP_URL`.

Tenant-owned API routes use `requireOrganization`. A request may send `X-Organization-Id`, or
fall back to the session's active organization. In both cases the API queries membership before
setting trusted organization context; the header alone never grants access. Use
`GET /api/private/organization` as the reference implementation.
