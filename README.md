# RN CF Monorepo

Cloudflare-first pnpm monorepo scaffold with a universal Expo app (iOS, Android, web via React Native Web) and a Hono Workers API.

## Status

- App: Expo Router + Uniwind — home, sign-in, register, check-email, forgot/reset password, account/health
- API: Hono Workers + OpenAPI + Scalar + Better Auth + D1 + varlock
- Auth email: verification + password reset (console locally / Cloudflare Email Service in production)
- Tenancy: organizations, owner/admin/member roles, invitations, and active organization sessions
- Hardening: security headers, CORS allowlist, rate limits, body limit, `requireAuth` sample
- API client: Orval-generated TanStack Query hooks, MSW handlers, and Faker factories
- Docs site: Astro Starlight
- E2E: Playwright smoke tests against Expo web + API
- CI/CD: GitLab multi-file pipeline

## Tech Stack

- **Package manager:** pnpm workspaces
- **Client:** Expo (React Native + React Native Web), Expo Router, Uniwind (Tailwind v4)
- **API:** Hono, Cloudflare Workers, `@hono/zod-openapi`, Better Auth (+ Expo plugin), varlock
- **Docs:** Astro Starlight
- **Linting:** oxlint
- **Formatting:** oxfmt
- **Secrets / env:** varlock (`.env.schema`, `varlock-wrangler`, `varlock scan`)
- **Type checking:** tsgo (`@typescript/native-preview`) / `tsc` (Expo) / `astro check`
- **Git hooks:** Lefthook

## Quick Start

### Prerequisites

- Node.js 24+ (see `.nvmrc`)
- pnpm 11 (`corepack enable`)

### Install

```bash
pnpm install
pnpm setup
```

To rename the scaffold for a new product (preview first):

```bash
pnpm productize -- --dry-run --name "Acme Learn" --slug acme-learn
```

Seed local demo users + shared workspace (API must be running):

```bash
pnpm seed:demo
```

Scaffold another org-scoped feature screen:

```bash
pnpm scaffold-feature -- --name tasks --title "Tasks"
```

### Start the scaffold

```bash
pnpm dev
```

This starts:

| Surface | URL                   |
| ------- | --------------------- |
| App web | http://localhost:8081 |
| API     | http://localhost:8787 |
| Docs    | http://localhost:4321 |

Run services individually:

```bash
pnpm dev:app
pnpm dev:api
pnpm dev:docs
pnpm dev:ios
pnpm dev:android
```

## Workspace Layout

```text
apps/
  api/         Hono Workers API
  app/         Expo Router universal client
  docs/        Astro Starlight docs
  e2e/         Playwright smoke tests

packages/
  config/      Shared tsconfig presets
  types/       Shared zod schemas and DTOs
  api-client/  Orval-generated TanStack Query hooks and MSW
```

## Common Commands

| Command             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `pnpm setup`        | Prepare local Varlock overrides, migrate D1, install Playwright |
| `pnpm format`       | Format with oxfmt                                               |
| `pnpm format:check` | Check formatting                                                |
| `pnpm lint`         | Fix lint issues with oxlint                                     |
| `pnpm lint:check`   | Lint without writing                                            |
| `pnpm typecheck`    | Run workspace type checks                                       |
| `pnpm test`         | Run workspace smoke tests                                       |
| `pnpm test:e2e`     | Run Playwright smoke tests                                      |
| `pnpm codegen`      | Export OpenAPI + regenerate api-client                          |
| `pnpm build`        | Build all workspaces                                            |
| `pnpm ci:check`     | Run local CI-equivalent checks                                  |

## Cloudflare notes

1. Create a D1 database: `pnpm --filter @rn-cf/api exec wrangler d1 create rn-cf`
2. Put the returned `database_id` into `apps/api/wrangler.toml`
3. Configure environment contracts in `.env.schema`, developer overrides in ignored `.env.local`
   files, and deployed secrets through CI or a Varlock secret-provider function
4. Deploy API: `pnpm --filter @rn-cf/api deploy` (`varlock-wrangler`)
5. Export and deploy web: `pnpm --filter @rn-cf/app deploy`

See [SECURITY.md](./SECURITY.md) for hardening details.
