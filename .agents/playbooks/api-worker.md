# Playbook: api-worker

Hono Worker, D1/Drizzle, Better Auth server, Queues, OpenAPI contracts.

## Skills to load

1. `launchpad-architecture` when touching authz, migrations, bindings, or release gates
2. `hono` and/or `workers-best-practices` / `wrangler` as relevant
3. `drizzle-orm` with launchpad D1 overrides (from architecture skill)
4. Better Auth skills when changing auth/org server behavior
5. `orval` + contract workflow when OpenAPI / `packages/types` change (`pnpm codegen`)

## Recipes

- `apps/api/AGENTS.md`
- Starlight **Architecture**, **Authentication**, **Environment**

## Subagents

Allowed: parallel explore of route module vs schema/migration when both change; research Subagent
for Cloudflare primary docs.  
Not allowed: Subagent running `db:migrate:remote`, deploy, or secret rotation.

## Done when

Focused API typecheck/tests pass; migrations paired with schema; generated client updated when the
contract changed.
