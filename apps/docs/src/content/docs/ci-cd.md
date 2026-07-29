---
title: CI/CD
description: GitLab pipeline overview
---

GitLab CI runs format, lint, typecheck, architecture fitness (`pnpm check:architecture`: bans
silencing modularity / complexity lint rules), API tests, e2e, generated-code drift, fresh-database
migration validation, Expo config validation, and builds for the Expo web export and docs.
Cloudflare deploy jobs remain disabled until account credentials are configured. Native EAS build,
submit, staged update, and rollback jobs are default-branch-only manual actions using protected
credentials; store production promotion remains manual.
