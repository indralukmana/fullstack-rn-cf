# Documentation Agent Instructions

These instructions extend the root `AGENTS.md` for the Starlight documentation.

- Documentation is part of the product. Update it in the same logical change as behavior,
  configuration, operations, customer-flow, or agent-policy changes.
- Keep agent policy in sync: root `AGENTS.md` is canonical; Starlight **Agent guardrails** is the
  human summary; **Agent harness** maps guides vs sensors. Do not invent a third conflicting policy.
- Verify commands and file paths against the repository; do not invent successful output.
- Mark placeholders, paid services, beta features, irreversible choices, and destructive or
  externally mutating commands explicitly.
- Keep quick-start guidance short and link to deeper concepts, guides, references, and runbooks.
- Runbooks must include prerequisites, impact, verification, rollback/recovery, and escalation.
- Retrospective ADRs must distinguish verified facts from reconstructed rationale.
- Never place real domains, account IDs, credentials, customer data, or private contacts in docs.

Focused check:

```bash
pnpm --filter @rn-cf/docs typecheck
```
