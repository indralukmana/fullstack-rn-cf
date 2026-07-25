# E2E Agent Instructions

These instructions extend the root `AGENTS.md` for Playwright tests.

- Test customer-visible behavior and security boundaries, not implementation details.
- Keep tests isolated, deterministic, and safe for parallel execution.
- Use unique generated identities and shared helpers; do not depend on test ordering.
- Preserve traces and screenshots for failures without recording secrets or auth tokens.
- Cover web smoke flows here. Document native device coverage separately rather than implying
  Chromium proves iOS or Android behavior.
- A skipped or retried test is not a fix; identify and remove the source of flakiness.

Focused checks:

```bash
pnpm --filter @rn-cf/e2e typecheck
pnpm test:e2e
```
