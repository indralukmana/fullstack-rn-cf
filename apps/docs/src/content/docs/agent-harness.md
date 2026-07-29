---
title: Agent harness
description: Feedforward guides and feedback sensors that keep agents from shipping slop
---

The coding agent is **model + harness**. This launchpad’s outer harness steers work before code is
written and fails closed after. Prefer **computational** sensors (lint, types, tests) over “LLM as
judge.” Host-only tools are optional; clones must rely on what is in this repo.

Industry framing (feedforward vs feedback, computational vs inferential): Martin Fowler’s
[Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html).

## Feedforward (guides)

| Guide                                          | Role                                                    |
| ---------------------------------------------- | ------------------------------------------------------- |
| Root / workspace `AGENTS.md`                   | Contract: Hard Stops, workflow, invariants              |
| `launchpad-orchestrate` + `.agents/playbooks/` | Which Skills to load; when Subagents are allowed        |
| `CONTEXT.md` / `.agents/CONTEXT.md`            | Product vs agent vocabulary (`CONTEXT-MAP.md`)          |
| `apps/app/DESIGN.md`                           | Visual system for Expo UI                               |
| Starlight domain + ADRs                        | Billing and tenancy rules agents must not invent around |

## Feedback (sensors)

| Sensor                            | When                            | Catches                                      |
| --------------------------------- | ------------------------------- | -------------------------------------------- |
| oxfmt / oxlint (incl. modularity) | pre-commit + pre-push + CI      | Style, complexity, oversized modules         |
| Typecheck                         | pre-commit (TS) + pre-push + CI | Broken contracts                             |
| Varlock staged scan               | pre-commit                      | Secrets in the index                         |
| `pnpm check:architecture`         | pre-push + `ci:check`           | Silencing modularity / complexity lint rules |
| Vitest / Playwright / Maestro     | CI or Playbook done-criteria    | Behavior holes that still typecheck          |
| Human review                      | After green sensors             | Intent, product judgment                     |

Modularity lint (and the ban on disabling it) is an **architecture fitness function**. A giant
screen file fails the same way a red test does. Cross-package import rules stay on pnpm workspace
deps and TypeScript until a real module-graph tool is worth the cost.

## Playbook done-criteria (behavior)

Green format and lint are not enough for billing and authz. When a Playbook touches those areas:

- **billing / api-worker (authz, webhooks, Entitlement):** add or update Vitest on the changed
  path; do not ship types-only.
- **expo-ui:** typecheck; keep shared RN + web behavior aligned.
- **native-dx:** follow Getting started recipes; Maestro when changing auth/Account smoke paths.

If the same class of agent mistake shows up twice, add a sensor (lint rule, test, or a real
dependency boundary tool). Do not only add another paragraph to `AGENTS.md`.

## Anti-patterns

- Disabling modularity checks to land a change
- Inferential review as the only gate (slow, arguable, easy to ignore)
- Requiring personal host plugins in Playbooks
- Trusting green format/lint while skipping tests on Entitlement or webhook code

## Related

- [Agent guardrails](/agent-guardrails/) — policy and Hard Stops
- [Agent skills](/agent-skills/) — vendor Skills vs Contract
- [Testing](/testing/) — Vitest, Playwright, Maestro
