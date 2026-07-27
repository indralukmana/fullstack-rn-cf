---
title: Derive a product
description: What to change when forking this scaffold into a real product
---

Use this launchpad as the shared basis for multiple products. Change product identity, skin, and
catalog; leave auth, tenancy, billing ledger, and codegen mechanics alone unless you are
deliberately evolving the launchpad itself.

Read [Domain language](/domain/) first so product copy and server terms stay aligned.

## Recommended fork shape

1. **Clone or branch** this monorepo (or copy it into a private product repo).
2. **Rename identity** with `pnpm productize` (app name, scheme, bundle IDs, Worker/Pages/D1/queue
   names). Preview with `--dry-run`.
3. **Reskin** via `apps/app/DESIGN.md` and Uniwind tokens — not a parallel UI kit.
4. **Point env and stores** at product-specific Cloudflare, Stripe, RevenueCat, and EAS projects.
5. **Add product features** as new routes, screens, and API modules on top of membership and
   Entitlement checks (`requireEntitlement` + `EntitlementGate`).
6. **Keep launchpad upgrades mergeable** when you still track upstream; avoid rewriting the billing
   ledger or auth stack in the product fork.

### Productize command

```bash
pnpm productize -- --dry-run --name "Acme Learn" --slug acme-learn
pnpm productize -- --name "Acme Learn" --slug acme-learn --scheme acmelearn --bundle-id com.acme.learn
```

`productize` does **not** rename `@rn-cf/*` workspace packages (keeps merges and tooling stable).
Review the diff after running it.

## Change these

| Area                       | Where                                                           | Notes                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display name, slug, scheme | `apps/app/app.json`                                             | Defaults are `RN CF`, `rn-cf`, scheme `rncf`.                                                                                                      |
| Bundle / package IDs       | `apps/app/app.json` → `ios.bundleIdentifier`, `android.package` | Default `com.rncf.launchpad`.                                                                                                                      |
| Icons, splash, favicon     | `apps/app/assets/`                                              | Replace before store submission.                                                                                                                   |
| Visual system              | `apps/app/DESIGN.md`, `apps/app/global.css`                     | Semantic tokens + anti-slop constraints; keep Uniwind.                                                                                             |
| Public URLs                | `apps/app/.env.schema`                                          | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_URL`.                                                                                                      |
| Billing catalog keys       | `apps/api/.env.schema`, `apps/app/.env.schema`                  | Entitlement key, offering, Stripe prices, RevenueCat app/product IDs. Keys are catalog config, not domain nouns — see [Domain language](/domain/). |
| Docs site title / `site`   | `apps/docs/astro.config.mjs`                                    | Replace the example docs hostname.                                                                                                                 |
| Deploy project names       | App/API deploy scripts, Wrangler config                         | e.g. Pages `rn-cf-web`, Worker name, D1/Queue names.                                                                                               |
| Legal / support URLs       | Store listings + in-app Account copy                            | Privacy, terms, support, deletion, subscription disclosures.                                                                                       |

After `.env.schema` edits, regenerate types with the repo’s varlock codegen scripts and re-run
focused typechecks.

## Leave these alone (unless evolving the launchpad)

- Better Auth session model, email verification, and password reset flows
- Organization membership, roles, invitations, and active-organization verification on the API
- Billing event ingest → queue → grant projection → entitlement recompute
- Fail-closed production config (no silent development fallbacks in prod)
- Orval codegen path (`packages/types` → `packages/api-client`)
- Cloudflare bindings generated from Wrangler (do not hand-maintain binding types)
- Core invariants in root `AGENTS.md` (server-side authz, idempotent webhooks, no secrets in logs)
- `@rn-cf/*` package names (unless you intentionally leave the launchpad upgrade path)

Products should **call** Entitlement checks and membership helpers, not re-implement them in the
client.

### Entitlement gates

- API: compose `requireAuth` then `requireEntitlement()` (optional key / `subject: "organization"`
  when org-owned billing is live). See `GET /api/private/pro`.
- App: wrap paid screens in `EntitlementGate` and still protect the API. Example: `/pro`.

### Feature modules

Shared org-scoped storage lives in `feature_item` (`/api/features/{featureKey}/items`). Scaffold a
screen + e2e stub:

```bash
pnpm scaffold-feature -- --name tasks --title "Tasks"
```

Then register the Expo route in `_layout.tsx` and link it from Account. The launchpad ships
`/notes` as the reference screen.

### Demo seed

With the API running locally:

```bash
pnpm seed:demo
```

Creates verified `owner@example.com` / `member@example.com` (password printed) and a shared
`demo-workspace` Organization. Idempotent; disabled in production.

## Domain vs catalog naming

- Domain: **User**, **Account**, **Organization**, **Subscription**, **Grant**, **Entitlement**,
  **Trial**, **Grace Period** — see [Domain language](/domain/).
- Catalog / store: entitlement key strings (`pro`, `premium`), offerings, packages, price IDs —
  configure per product; do not promote them into ubiquitous language.
- UI may say “Premium” or “Full access”; the API still authorizes from **Entitlement**.

## Target model vs current billing code

Architectural decisions say the **Organization** owns the Subscription and provider customer
identity. Current launchpad code still keys many billing paths to the **User**. That mismatch is
**deferred** while the scaffold is polished; do not deepen User-as-payer shortcuts in product
forks if you expect org-owned billing later.

See:

- [Organization owns the subscription](/adr/0001-organization-owns-subscription/)
- [Provider customers map to Organization](/adr/0003-provider-customers-map-to-organization/)

## Product feature checklist

When adding product-specific capability:

1. Define server authorization from Active Organization **Entitlement** (and membership role when
   needed).
2. Add Zod/OpenAPI contracts in `packages/types`, then `pnpm codegen`.
3. Add Expo screens with shared UI primitives (`apps/app/components/ui.tsx`) and `DESIGN.md`.
4. Extend Playwright only for user-visible web flows you care about in CI.
5. Update Starlight docs in the same change when behavior or ops steps change.

## What not to invent early

- Parallel “personal vs team” billing systems
- Client-granted Pro / Premium flags
- Seat billing (out of launchpad scope unless a product deliberately adds it)
- A second design system beside Uniwind + `DESIGN.md`
