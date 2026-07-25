# Generated API Client Instructions

These instructions extend the root `AGENTS.md` for `packages/api-client`.

- Do not edit files under `src/generated/` or `openapi.json` directly.
- Change API schemas and route metadata at the source, then run `pnpm codegen`.
- Review generated output for accidental endpoint removal, unstable operation IDs, leaked
  internals, and unexpectedly broad churn.
- Keep custom transport, error decoding, and query behavior outside generated directories.
- Commit the API contract and its generated client output together as one review unit.

Focused checks:

```bash
pnpm codegen
pnpm --filter @rn-cf/api-client typecheck
```
