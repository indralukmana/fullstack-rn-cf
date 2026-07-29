---
title: Contributing
description: Local workflow for humans and coding agents
---

## Local loop

1. `pnpm install && pnpm setup`
2. Prefer `pnpm format` / `pnpm lint` before pushing
3. After API route or contract changes, run `pnpm codegen`
4. Keep the Expo app universal — avoid DOM-only APIs without platform guards
5. Env changes belong in `.env.schema` (varlock); run `pnpm exec varlock codegen --path apps/api`
   (and `apps/app`) after schema edits

Pre-commit (lefthook) runs format, oxlint, workspace typecheck, and a secret scan. Pre-push also
runs format/lint/typecheck checks and `pnpm check:architecture`. Fix failures; do not use
`--no-verify`.

## Coding agents

Agents must follow root `AGENTS.md`, the nearest workspace `AGENTS.md`, and
[Agent guardrails](/agent-guardrails/). Skills are optional depth — see [Agent skills](/agent-skills/).

Notable agent rules:

- No deploy, push, remote migrate, or secret/billing live changes without explicit approval
- Keep changes small and commit finished logical units after checks pass
- When oxlint modularity rules fail, extract modules — do not disable those rules
- Update Starlight docs in the same change when behavior or ops guidance changes

## Docs

Documentation is part of the product. Prefer short getting-started pages that link to deeper
guides. Mark placeholders, paid services, beta features, and destructive commands explicitly.
