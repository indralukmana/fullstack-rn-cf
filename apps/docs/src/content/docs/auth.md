---
title: Auth
description: Better Auth on Workers + Expo
---

Email/password auth is enabled via Better Auth on the Workers API.

Auth construction is split at a compose-time seam:

- **Identity core** — email/password, verification, Expo (`createIdentityAuthOptions` /
  `createIdentityAuthClientPlugins`)
- **Organization adapter** — Better Auth `organization` plugin, personal Organization on signup,
  default active Organization on session (`applyOrganizationAuthAdapter` /
  `createOrganizationAuthClientPlugins`)

This launchpad always composes the organization adapter inside `createAuth` and `authClient`. That
is not an env flag. A no-tenancy fork omits the adapter; it does **not** mean Organizations are
gone from this product while the adapter stays wired.

- Server plugin: `@better-auth/expo`
- Client: `better-auth/react` + `@better-auth/expo/client`
- Trusted origins: `CORS_ORIGINS` + `TRUSTED_ORIGINS` + native scheme from `app.json` (`rncf://`) / `exp://`
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

Every new User receives an **Organization of one** at signup (`{name}'s organization`). The first
session activates that Organization. Users may still create additional Organizations later.

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

### Lifecycle

Owners and admins manage members from `/organizations`:

| Action             | Who                | Notes                                                              |
| ------------------ | ------------------ | ------------------------------------------------------------------ |
| Invite             | owner, admin       | Email invitation → `/accept-invitation`                            |
| Remove member      | owner, admin       | Membership ends immediately for that User                          |
| Leave              | any non-sole-owner | Sole owners must transfer or close first                           |
| Transfer ownership | owner              | Promote another member to owner, then demote self (often to admin) |
| Close organization | owner              | Blocked while an active/grace Subscription exists (ADR 0004)       |

Account deletion (`/account-data`) is blocked while the User solely owns any Organization or an
owned Organization still has live Subscription obligations (ADR 0002). Clear those blockers —
transfer, close, or manage billing with the provider — before delete.
