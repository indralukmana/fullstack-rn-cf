---
title: API reference
description: HTTP surface map; OpenAPI is the contract source of truth
---

Machine-readable contract: **`GET /doc`** (OpenAPI JSON) and **`GET /scalar`** (Scalar UI). After route
or schema changes, run `pnpm codegen` so `packages/api-client` stays aligned. Prefer those over this
page for request/response shapes.

## Route groups

| Mount                                       | Auth                        | Purpose                                      |
| ------------------------------------------- | --------------------------- | -------------------------------------------- |
| `GET /health`                               | none                        | Liveness                                     |
| `GET /api/me`                               | optional session            | Current user or `{ user: null }`             |
| `* /api/auth/*`                             | Better Auth                 | Sign-in, session, organization plugin routes |
| `GET/POST /api/billing/*`                   | session + org (varies)      | Status, Checkout, Portal, reconcile          |
| `POST /api/webhooks/stripe`                 | Stripe signature            | Billing webhook ingest                       |
| `POST /api/webhooks/revenuecat`             | RC auth                     | Billing webhook ingest                       |
| `GET /api/account/export`                   | session                     | Privacy export                               |
| `DELETE /api/account/`                      | session                     | Account delete (org blockers apply)          |
| `GET/POST /api/features/{featureKey}/items` | session + org               | Demo feature CRUD (notes/tasks keys)         |
| `GET /api/private/ping`                     | session                     | Authenticated ping                           |
| `GET /api/private/pro`                      | session + org + Entitlement | Paid capability probe                        |
| `GET /api/private/organization`             | session + org               | Verified Active Organization context         |
| `GET/DELETE /api/dev/mailbox`               | development only            | Console email capture                        |
| `POST /api/dev/seed`                        | development only            | Demo seed helper                             |

Exact paths, bodies, and status codes live in OpenAPI. Billing and Account behavior is documented
under [Billing](/billing/) and [Auth](/auth/).
