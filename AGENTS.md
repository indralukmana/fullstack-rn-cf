# Agent Contract

This file is the canonical repository-wide contract for coding agents. Read the nearest
`AGENTS.md` before editing a workspace. Human instructions and the current user request
override this file.

For architecture, auth, billing, Expo, Worker, environment, migration, code-generation, or release
work, load `.agents/skills/launchpad-architecture/SKILL.md` before the relevant vendor skill. For
Expo UI / visual work, also read `apps/app/DESIGN.md` before generic frontend or deslop skills.

## Repository map

- `apps/api`: Hono API on Cloudflare Workers, D1, Drizzle, Better Auth
- `apps/app`: Expo Router application for web, iOS, and Android
- `apps/docs`: Astro Starlight documentation
- `apps/e2e`: Playwright browser tests
- `packages/types`: shared Zod/OpenAPI contracts
- `packages/api-client`: generated Orval client, MSW handlers, and factories

## Safety

- Preserve user changes. Never discard, overwrite, or reformat unrelated work.
- Never expose or commit secrets, `.env` files, credentials, customer data, or auth links.
- Do not deploy, push, migrate a remote database, rotate secrets, change billing, or run
  destructive Git commands without explicit user approval.
- Treat `pnpm setup`, `pnpm format`, `pnpm lint`, `pnpm codegen`, migration commands, and
  deploy commands as mutating operations.
- Production configuration must fail closed. Never add a silent development fallback.

## Change workflow

1. Inspect the relevant implementation, tests, docs, and nearest instructions.
2. Make the smallest coherent change. Avoid unrelated cleanup and dependency churn.
3. Add or update tests for behavior and security boundaries.
4. Run focused checks first, then the broader workspace gate when warranted.
5. Review the complete diff for secrets, generated churn, and unrelated files.
6. Commit each verified logical change separately after checks pass. Do not wait to be asked
   to commit finished, reviewable work; leave unrelated WIP unstaged.

Use concise commit messages that explain why. Keep migrations with their schema change and
generated API artifacts with their contract change; those pairs are one review unit.

## Required checks

- TypeScript/API: `pnpm --filter @rn-cf/api typecheck` and focused Vitest tests
- Expo app: `pnpm --filter @rn-cf/app typecheck`
- Docs: `pnpm --filter @rn-cf/docs typecheck`
- API contract changes: `pnpm codegen`, then verify the generated diff
- Milestone completion: `pnpm ci:check`; run E2E when user-visible flows change

## Code size and modularity

Prefer small, focused modules over large screens or services. Numeric limits live in
[`.oxlintrc.json`](.oxlintrc.json) (`complexity`, `max-lines-per-function`, `max-lines`,
`max-statements`, `max-depth`, `max-params`).

- When those rules fail, extract helpers or components into adjacent modules.
- Do not disable, weaken, or `eslint-disable` / oxlint-ignore modularity rules without explicit
  human approval.
- Do not invent one-line wrapper files solely to game line counts; split along real
  responsibilities (actions, sections, SQL builders, services).

## Core invariants

- Every tenant-owned operation verifies membership and authorization server-side.
- Clients never decide entitlements; Stripe and RevenueCat events project server state.
- Webhook and Queue processing is idempotent and safe under at-least-once delivery.
- Logs are structured and must not contain secrets, tokens, auth URLs, or sensitive payloads.
- Cloudflare bindings are generated from Wrangler configuration; do not hand-maintain them.
- Prefer managed Cloudflare primitives and bindings over bespoke infrastructure or REST hops.
