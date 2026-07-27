---
title: Agent guardrails
description: How coding agents must work in this repository
---

This page is the human-readable companion to the root `AGENTS.md` contract. Agents must follow that
file (and the nearest workspace `AGENTS.md`) even when a vendor skill suggests something else.

## Precedence

1. Human request and explicit approval boundaries
2. Root and nearest workspace `AGENTS.md`
3. `.cursor/rules` and `.agents/skills/launchpad-architecture`
4. Vendor skills for the API you are calling (Cloudflare, Expo, Stripe, …)
5. Generic model knowledge

See [Agent skills](/agent-skills/) for skill install/update rules and Expo UI overrides.

## Hard stops (need explicit human approval)

Do **not** do these unless the user clearly asks:

- Deploy, push to remote, or promote environments
- Remote D1 migrations (`db:migrate:remote` and equivalents)
- Secret rotation, billing catalog/live credential changes, or store submission
- Destructive Git (`reset --hard`, force-push, history rewrite)

Treat `pnpm setup`, `pnpm format`, `pnpm lint`, `pnpm codegen`, migrations, and deploys as
**mutating**. Production config must **fail closed** — never add a silent development fallback in
prod.

## Change workflow

1. Read relevant code, tests, docs, and the nearest `AGENTS.md`.
2. Make the smallest coherent change. No drive-by refactors or dependency churn.
3. Add or update tests for behavior and authz/security boundaries.
4. Run focused checks, then broader gates when the change warrants it.
5. Review the full diff for secrets, generated churn, and unrelated files.
6. Commit each verified logical change separately after checks pass. Leave unrelated WIP
   unstaged.

Pair migrations with their schema change, and generated API client artifacts with their contract
change.

## Code size and modularity

Oxlint enforces size and complexity limits in `.oxlintrc.json` (`complexity`,
`max-lines-per-function`, `max-lines`, `max-statements`, `max-depth`, `max-params`). Screens, tests,
and scripts use documented overrides; numbers in that file win over this page.

When a modularity rule fails:

- Extract helpers, services, or section components into adjacent modules (API:
  `apps/api/src/lib/...`; Expo screens: `apps/app/app/_parts/...`; shared UI:
  `apps/app/components/...`).
- Split along real responsibilities — not one-line wrappers to game line counts.
- **Do not** disable, weaken, or `eslint-disable` / oxlint-ignore modularity rules without
  explicit human approval.

Pre-commit runs format, lint, typecheck, and secret scan. Fix the rule; do not skip hooks.

## Domain and billing invariants

- Tenant-owned operations verify **membership** and authorization on the server.
- Clients never grant Entitlements. Stripe and RevenueCat project server state; UI may display
  store state only.
- Webhooks and Queues are idempotent under at-least-once delivery.
- Logs must not contain secrets, tokens, auth URLs, or sensitive payloads.
- Cloudflare bindings come from Wrangler + codegen — do not hand-maintain binding types.
- Prefer managed Cloudflare bindings over bespoke REST hops from Workers.

Organization lifecycle (leave, remove member, close, ownership transfer) and Account delete
blockers are documented under [Auth](/auth/#organizations) and ADRs 0002 / 0004.

## Docs as product

Update Starlight docs in the same logical change when behavior, ops steps, or agent policy
change. Verify commands and paths against the repo. Never put real secrets, private contacts, or
customer data in docs.

## Quick checklist for agents

- [ ] Nearest `AGENTS.md` read
- [ ] No deploy/push/remote migrate/secret change without approval
- [ ] Server authz / Entitlement rules preserved
- [ ] Modularity lint green without disabling those rules
- [ ] Focused typecheck/tests run
- [ ] Docs updated when user-visible or ops behavior changed
- [ ] Small logical commit(s) after checks pass
