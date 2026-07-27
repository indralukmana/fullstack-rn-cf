---
name: launchpad-architecture
description: Applies this repository's Cloudflare, Expo, authentication, billing, generated-client, Drizzle/D1, and release invariants. Use when changing architecture, Hono routes, D1 schema or migrations, Better Auth, organizations, Stripe, RevenueCat, entitlements, Expo native flows, Varlock configuration, or release automation in this launchpad.
---

# Launchpad architecture

Use vendor skills for current product APIs, then apply this skill as the repository-specific
constraint layer. Read the root and nearest workspace `AGENTS.md` before editing. Repository rules
and existing behavior override generic vendor examples.

## System shape

- `apps/api`: Cloudflare Worker, Hono OpenAPI, D1/Drizzle, Better Auth, Queues, scheduled work.
- `apps/app`: Expo Router universal app using a development build, Uniwind, TanStack Query, and the
  generated API client.
- `packages/types`: shared Zod request/response contracts.
- `packages/api-client`: Orval-generated fetch/TanStack Query client, MSW, and Faker artifacts.
- `apps/e2e`: Playwright against Expo web and the local Worker.

Do not replace these choices with Expo API routes, EAS Hosting, NativeWind, Hono RPC, PostgreSQL,
Resend, or a second environment loader unless the user explicitly requests an architecture change.

## Billing invariants

- Organization id is the immutable billing identity for Stripe and RevenueCat. Never use email as
  provider identity. The User is only the checkout/restore actor.
- Organization `pro` entitlement is server-authoritative and uses OR semantics across active
  production Stripe and RevenueCat grants for that Organization.
- Native purchases use RevenueCat with the active Organization as App User ID; web purchases use
  Stripe. Provider catalog IDs stay in server configuration, not client requests.
- Client RevenueCat state may drive purchase UI feedback but never authorizes paid API behavior.
- Keep sandbox and production grants isolated. Unknown organizations, apps, products, or
  environments fail closed.
- Webhooks are authenticated, durably ingested, deduplicated, queued, and reconciled against
  authoritative provider state. Design for duplicate, delayed, and out-of-order delivery.
- Never grant access by directly editing aggregate entitlements. Project provider grants and
  recompute, replay, or reconcile.
- Account deletion must reject when the user owns Organizations with active provider subscriptions
  and preserve required audit records.

When a RevenueCat skill recommends client-only entitlement gating, retain the server status and
paid-route checks. When a Stripe skill recommends Connect, ignore it unless the product actually
routes money to third parties.

## Authentication and tenancy

- Better Auth owns identity, sessions, verification, and organization membership.
- Require verified email before purchase creation and sensitive lifecycle operations.
- Derive organization context from authenticated membership; never trust a submitted organization
  ID or role.
- Cloudflare Email Service is the production email provider; local development uses the redacted
  console mailbox.
- Better Auth schema generation and Drizzle migration generation are separate reviewed steps.
  Drizzle ORM 1 uses nested `drizzle/<folder>/migration.sql` files and RQB v2 relations in
  `apps/api/src/db/relations.ts` (not `relations()` beside table schemas).
  Never hand-edit generated auth schema casually.
- When the vendor `drizzle-orm` skill shows PostgreSQL tables, flat `*.sql` migrations, or RQB v1
  `relations()` / callback `where` filters, follow this launchpad instead: SQLite/`sqliteTable`,
  Wrangler `migrations_pattern = "drizzle/*/migration.sql"`, `defineRelations()`, and object
  `where` filters. Apply migrations with Wrangler D1 (`db:migrate:local` / approved remote), not
  generic Node migrate scripts, unless the user asks otherwise.

## Worker and data rules

- Keep the Worker module export for `fetch`, Queue, and scheduled handlers; tests may use the named
  Hono app.
- Use direct Cloudflare bindings and generated binding types. Do not call Cloudflare REST APIs from
  the Worker when a binding exists.
- D1 is SQLite on Workers. Do not import Node-only runtime libraries into Worker code or assume
  PostgreSQL behavior.
- Make Queue consumers idempotent, bound retries, use `waitUntil` for post-response work, and avoid
  global mutable request state.
- Logs are structured and correlated, but exclude secrets, auth links, provider payloads, tokens,
  and customer data.

## Contract workflow

For API contract changes:

1. Update shared Zod schemas and OpenAPI route definitions.
2. Add or update API tests.
3. Run `pnpm codegen`.
4. Consume generated operations from `@rn-cf/api-client`; do not handwrite duplicate API types or
   edit generated files.
5. Run `pnpm codegen:check`.

For D1 changes:

1. Update Drizzle schema.
2. Generate a forward migration.
3. Review SQL and Drizzle metadata together.
4. Test behavior and run `pnpm migrations:check`.

## Expo rules

- Use Expo development builds for RevenueCat and other native modules; Expo Go is insufficient.
- Preserve web, iOS, and Android behavior or use explicit `.native`/`.web` modules.
- Use Uniwind classes and its official skill; do not apply NativeWind setup instructions.
- For visual or layout work, read `apps/app/DESIGN.md` first. Vendor UI skills
  (`baseline-ui`, `improve-ui`, `frontend-ui-engineering`, accessibility packs) polish within that
  system — they must not replace Uniwind, invent a web-only stack, or introduce banned AI-default
  aesthetics documented there.
- Treat public Expo values as bundle-visible. Server/provider secrets must never enter native code.
- Use RevenueCat public SDK keys from Varlock/EAS and clear SDK identity on sign-out.
- OTA updates cannot change native dependencies, permissions, billing SDKs, or privacy manifests.

## Environment and release

- `.env.schema` is authoritative. Local overrides belong in ignored `.env.local`; deployed values
  come from protected CI/EAS variables or Varlock providers.
- Never read or print raw override files. Validate with redacted `varlock load`.
- Do not deploy, submit stores, migrate remote D1, mutate provider dashboards, or rotate secrets
  without explicit user approval.
- Before milestone completion run focused tests, then `pnpm release:check`. Native billing still
  requires the documented Apple Sandbox/TestFlight and Google license/internal-test matrix.
