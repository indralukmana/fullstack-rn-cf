# RN CF — Expo + Cloudflare SaaS launchpad

**GitHub template** for a Cloudflare-first pnpm monorepo: universal Expo app (iOS, Android, web)
and a Hono Workers API with Better Auth, Organization tenancy, and org-owned Stripe/RevenueCat
billing.

## Use this template

1. Click **Use this template** → **Create a new repository** (or
   `gh repo create my-app --template indralukmana/fullstack-rn-cf --clone`).
2. `pnpm install && pnpm setup`
3. Rename for your product:

```bash
pnpm productize -- --dry-run --name "Acme Learn" --slug acme-learn
pnpm productize -- --name "Acme Learn" --slug acme-learn --scheme acmelearn --bundle-id com.acme.learn
```

4. Follow docs: **Derive a product**, **Domain language**, and **Agent guardrails**
   (`pnpm dev:docs` → http://localhost:4321).

Coding agents: read root `AGENTS.md` (and the nearest workspace `AGENTS.md`). For non-trivial
tasks, load `launchpad-orchestrate` and follow a Playbook. Do not disable oxlint modularity rules;
extract modules instead.

## What’s included

- **App:** Expo Router + Uniwind — auth, organizations (invite/leave/close/transfer), subscription,
  account lifecycle, feature screens (`/notes` + `pnpm scaffold-feature`)
- **API:** Hono Workers + OpenAPI + Scalar + Better Auth + D1 + Queues + varlock
- **Billing:** Organization-owned Stripe (web) + RevenueCat (native), ledger → Entitlement projection,
  trials, shared-org Pro inheritance
- **Hardening:** fail-closed production config, security headers, CORS, rate limits, modularity lint
- **API client:** Orval TanStack Query hooks, MSW, Faker
- **Docs:** Astro Starlight (architecture, billing ADRs, agent guardrails)
- **E2E:** Playwright against Expo web + API
- **CI:** GitLab multi-file pipeline (optional for forks; GitHub Actions not required to use the
  template)

## Tech stack

| Area        | Choice                                             |
| ----------- | -------------------------------------------------- |
| Packages    | pnpm workspaces                                    |
| Client      | Expo Router, Uniwind (Tailwind v4)                 |
| API         | Hono, Cloudflare Workers, Better Auth, D1, Drizzle |
| Billing     | Stripe + RevenueCat → server Entitlements          |
| Env/secrets | varlock (`.env.schema`, `varlock-wrangler`, scan)  |
| Lint/format | oxlint (incl. size/complexity), oxfmt, Lefthook    |
| Types       | tsgo / `tsc` (Expo) / `astro check`                |

## Quick start

**Prerequisites:** Node.js 24+ (`.nvmrc`), pnpm 11 (`corepack enable`).

```bash
pnpm install
pnpm setup
pnpm dev
```

| Surface | URL                   |
| ------- | --------------------- |
| App web | http://localhost:8081 |
| API     | http://localhost:8787 |
| Docs    | http://localhost:4321 |

Useful local commands:

```bash
pnpm seed:demo                                          # demo org + users (API running)
pnpm scaffold-feature -- --name tasks --title "Tasks"   # auto-wires nav + Account link
pnpm native:urls                                        # print LAN/Tailscale URL suggestions
pnpm ci:check                                           # format/lint/types/architecture + workspace tests
# pnpm release:check                                    # launch gate (ci:check + drift + web export)
```

Per-app: `pnpm dev:app`, `pnpm dev:api`, `pnpm dev:api:lan` (API on `0.0.0.0` for phones),
`pnpm dev:docs`, `pnpm dev:ios`, `pnpm dev:android` (emulator URLs; first install:
`pnpm dev:android -- --run`). Physical device: see docs **Getting started** (Wi‑Fi / Tailscale).

## Workspace layout

```text
apps/
  api/         Hono Workers API
  app/         Expo Router universal client
  docs/        Astro Starlight docs
  e2e/         Playwright smoke tests

packages/
  config/      Shared tsconfig presets
  types/       Shared Zod / OpenAPI contracts
  api-client/  Orval-generated TanStack Query + MSW
```

## Common commands

| Command                   | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `pnpm setup`              | Prepare local Varlock overrides, migrate D1, install Playwright |
| `pnpm format`             | Format with oxfmt                                               |
| `pnpm format:check`       | Check formatting                                                |
| `pnpm lint`               | Fix lint issues with oxlint                                     |
| `pnpm lint:check`         | Lint without writing                                            |
| `pnpm typecheck`          | Run workspace type checks                                       |
| `pnpm check:architecture` | Ban silencing modularity / complexity lint rules                |
| `pnpm test`               | Run workspace smoke tests                                       |
| `pnpm test:e2e`           | Run Playwright smoke tests                                      |
| `pnpm codegen`            | Export OpenAPI + regenerate api-client                          |
| `pnpm build`              | Build all workspaces                                            |
| `pnpm ci:check`           | format, lint, types, modularity ban, workspace tests            |
| `pnpm release:check`      | `ci:check` + codegen/env/migration drift + Expo web export      |
| `pnpm test:maestro`       | Local Maestro smoke (not CI)                                    |
| `pnpm productize`         | Rename identity for a product fork                              |

## Cloudflare notes

1. Create a D1 database: `pnpm --filter @rn-cf/api exec wrangler d1 create rn-cf`
2. Put the returned `database_id` into `apps/api/wrangler.toml`
3. Configure environment contracts in `.env.schema`, developer overrides in ignored `.env.local`
   files, and deployed secrets through CI or a Varlock secret-provider function
4. Deploy API: `pnpm --filter @rn-cf/api deploy` (`varlock-wrangler`)
5. Export and deploy web: `pnpm --filter @rn-cf/app deploy`

See [SECURITY.md](./SECURITY.md) for hardening details. Never commit `.env`, `.env.local`, or
provider secrets.
