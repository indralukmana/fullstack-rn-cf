# API Agent Instructions

These instructions extend the root `AGENTS.md` for `apps/api`.

- Keep `src/index.ts` composition-focused; put routes, domain services, and middleware in
  dedicated modules. Prefer `src/lib/...` extractions when oxlint modularity limits fail — do not
  disable those rules.
- Define external request/response contracts with Zod and OpenAPI. Regenerate the API client
  after contract changes.
- Use the generated `CloudflareBindings` type. Update Wrangler configuration and run
  `pnpm cf-typegen` after binding changes.
- All tenant-owned queries require verified tenant context and explicit authorization.
  Include tenant IDs in relevant unique constraints and indexes.
- D1 migrations are forward-compatible expand/contract changes. Never edit an applied
  migration or run `db:migrate:remote` without explicit approval. Drizzle Kit 1 stores each
  migration as `drizzle/<folder>/migration.sql`; Wrangler discovers them via
  `migrations_pattern`. Relational query definitions live in `src/db/relations.ts` (RQB v2),
  not beside table schemas. After upgrading migration layout, reset local D1 state before
  re-applying (`db:migrate:local`) so Wrangler does not treat renamed folders as new.
- Webhooks, Queue consumers, and scheduled jobs must be idempotent and tolerate reordering,
  retries, duplicates, and partial provider outages.
- Use Cloudflare bindings instead of platform REST APIs from inside Workers.
- Never buffer unbounded bodies, store request state globally, or leave floating promises.
- Keep production errors generic; attach correlation details only to redacted structured logs.
- Tests run in the Workers pool with real D1 migrations. Add cross-tenant and negative-path
  coverage for authorization-sensitive changes.

Focused checks:

```bash
pnpm --filter @rn-cf/api typecheck
pnpm --filter @rn-cf/api test
```
