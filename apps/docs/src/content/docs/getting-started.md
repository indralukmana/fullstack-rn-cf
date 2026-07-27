---
title: Getting started
description: Install and run the RN CF scaffold
---

## Prerequisites

- Node.js 24+
- pnpm 11

## Install

```bash
pnpm install
pnpm setup
pnpm dev
```

`pnpm setup` creates an ignored API `.env.local` containing a random development auth secret.
Safe defaults come from each committed `.env.schema`; add only machine-specific overrides to
`.env.local`.

| Surface   | URL                   |
| --------- | --------------------- |
| App (web) | http://localhost:8081 |
| API       | http://localhost:8787 |
| Docs      | http://localhost:4321 |

Next: [Derive a product](/derive-a-product/) when turning this scaffold into a named app, and
[Domain language](/domain/) for shared vocabulary.
