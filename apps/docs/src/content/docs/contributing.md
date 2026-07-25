---
title: Contributing
description: Local workflow
---

1. `pnpm install && pnpm setup`
2. Prefer `pnpm format` / `pnpm lint` before pushing
3. After API route changes, run `pnpm codegen`
4. Keep the Expo app universal — avoid DOM-only APIs without platform guards
5. Env changes belong in `.env.schema` (varlock); run `pnpm exec varlock codegen --path apps/api` (and `apps/app`) after schema edits
