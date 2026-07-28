---
name: launchpad-orchestrate
description: >
  Routes launchpad work to a Playbook (native-dx, billing, expo-ui, api-worker): which Skills to
  load, whether Subagents are allowed, and where Recipes live. Use at the start of non-trivial
  tasks, when unsure which skill set applies, or when deciding to spawn a Subagent. Not for
  product domain language (see CONTEXT.md) and not a substitute for the AGENTS.md Contract.
---

# Launchpad orchestrate

Router only. Pick one Playbook, load what it names, follow the Contract. Do not copy runbook steps
here — Recipes stay in docs and workspace `AGENTS.md`.

Agent vocabulary: [`.agents/CONTEXT.md`](../CONTEXT.md). Product vocabulary: root `CONTEXT.md`.
Map: root `CONTEXT-MAP.md`.

## Steps

1. **Match a Playbook** from the table below (human request wins if they name one).
2. **Read that Playbook file** under `.agents/playbooks/`.
3. **Load only the Skills it lists** (plus root / nearest `AGENTS.md` you already owe).
4. **Spawn a Subagent only if** the Playbook’s Subagent section allows it, or the human asks.
5. **Done** when the Playbook’s skills are loaded (or explicitly skipped with reason) and Hard Stops
   are respected — then do the work using those materials.

## Playbooks

| Playbook | Reach when |
| --- | --- |
| [native-dx](../playbooks/native-dx.md) | Emulator, physical device, Tailscale/LAN URLs, Maestro, `dev:android`, `native:urls` |
| [billing](../playbooks/billing.md) | Stripe, RevenueCat, Entitlement, Grants, webhooks, subscription UI/API |
| [expo-ui](../playbooks/expo-ui.md) | Expo screens, Uniwind, DESIGN.md, deslop / a11y on `apps/app` |
| [api-worker](../playbooks/api-worker.md) | Hono routes, D1/Drizzle, Worker bindings, Better Auth server, Queues |

No match: stay on Contract + `launchpad-architecture` only if touching architecture; ask the human
if the task spans two Playbooks and they conflict.

## Hard Stops

Deploy, push, remote migrate, secrets, billing/store live changes, destructive Git — explicit human
approval. Never hand a Hard Stop to a Subagent as unsupervised work.

## Host plugins

Personal host tools (review frameworks, flow routers) are non-normative. Playbooks must not require
them. Clones must work with this repo’s Contract, Playbooks, and Skills alone.
