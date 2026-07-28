# Agent operating model

How coding agents are contracted, routed, and split in this repository. Not product language — see root `CONTEXT.md` for User / Organization / Entitlement.

## Language

**Contract**:
The always-loaded policy an agent must obey: safety, approvals, change workflow, and core invariants. Lives in root `AGENTS.md` and nearest workspace `AGENTS.md`.
_Avoid_: Skill, Playbook, system prompt (when you mean the repo policy)

**Playbook**:
A named task shape that selects which Skills to load and whether Subagents are allowed. Router-only: pointers and gates, not a copy of runbooks.
_Avoid_: Skill, Recipe (when you mean the routing unit), Runbook

**Skill**:
Progressively loaded how-to (usually under `.agents/skills`) for a vendor or local concern. Not policy; the Contract wins on conflict.
_Avoid_: Playbook, Contract

**Orchestrator**:
The repo-owned router that maps a human request to a Playbook (and thus Skills / Subagent rules). Host plugins (for example personal review or multi-agent tools) are non-normative and must not be required by the Contract or Playbooks.
_Avoid_: God agent, mega-script, CI pipeline, host-only workflow (when you mean the repo router)

**Subagent**:
An isolated agent run with a tight brief and a report back. Spawned only when the active Playbook allows it, or when the human explicitly asks.
_Avoid_: Skill, parallel shell (when you mean an agent Task)

**Hard Stop**:
An action that requires explicit human approval (deploy, push, remote migrate, secrets, billing/store, destructive Git). Never delegated to a Subagent as “just do it.”
_Avoid_: Check, lint gate

**Recipe**:
Ordered human/agent steps in docs or workspace `AGENTS.md` (for example native DX). Playbooks point at Recipes; they do not own the steps.
_Avoid_: Playbook, Skill
