---
title: Testing
description: Unit, integration, web Playwright, and native Maestro checks
---

```bash
pnpm test          # workspace tests (API vitest)
pnpm test:e2e      # Playwright against Expo web + API
pnpm typecheck
pnpm lint:check
pnpm codegen:check
pnpm env:check
pnpm migrations:check
pnpm release:check  # full clean-tree launch gate
```

## Layers

| Layer                       | Tool                      | Where it runs                          | What it proves                                 |
| --------------------------- | ------------------------- | -------------------------------------- | ---------------------------------------------- |
| API / domain                | Vitest in `@rn-cf/api`    | `pnpm test` / GitLab                   | Authz, billing projection, webhooks, D1        |
| Expo **web** customer flows | Playwright in `apps/e2e`  | `pnpm test` / `pnpm test:e2e` / GitLab | Browser UI against local Worker + Expo web     |
| Expo **native** smoke       | Maestro under `.maestro/` | **Local only** (not Lefthook / GitLab) | One sign-in → Account flow on a real RN binary |
| Store billing               | Manual / sandbox matrix   | Devices / stores                       | StoreKit and Play Billing                      |

### Gates

| Command              | Scope                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm ci:check`      | format, lint, typecheck, modularity-disable ban, workspace tests (API Vitest + Playwright via `apps/e2e`) |
| `pnpm release:check` | `ci:check` plus codegen/env/migration drift checks and Expo web export                                    |
| GitLab pipeline      | Those gates split across jobs, plus docs/web builds; Maestro and store matrix are not CI                  |

Billing Vitest covers authenticated webhook receipt, durable deduplication, provider projection,
dual-provider OR access, sandbox isolation, grace/expiry paths, unknown catalog/environment
rejection in several unit cases, Queue replay, Checkout/Portal authorization, paid-route
enforcement, privacy export, and subscription-safe deletion. Restore/refund are exercised mainly as
ledger states, not full provider-event → normalize integration paths. Playwright covers the protected
web paywall and mocked Stripe launch/return.

Native StoreKit and Play Billing cannot be proven in Node or browser CI. Complete the real-device
matrix in the [native release runbook](/native-release/) for every production candidate.

## Why not one tool for everything?

**Playwright** drives browsers. This repo already uses it for Expo web (`expo start --web`). It does
**not** drive iOS Simulator or Android Emulator UI. Do not treat a green `pnpm test:e2e` as native
coverage (see `apps/e2e/AGENTS.md`).

**Maestro** is a black-box mobile runner (YAML flows over the accessibility tree). It needs no RN
instrumentation, works with Expo development builds and EAS, and is what Expo documents for EAS
Workflow E2E. Prefer `testID` for stable selectors; visible text is fine for a first smoke.

**Detox** is gray-box and JS-native with strong idle sync, but needs native build wiring. Skip until
Maestro cannot cover a case you need.

**Appium** fits multi-stack WebDriver farms. Overkill for this launchpad.

**Raw adb** (`uiautomator dump`, `input tap`) is for debugging, not a suite: Android-only, brittle,
and reinvents what Maestro already does.

## Native Maestro (local)

Prerequisites: API on the host (`pnpm dev:api` or `pnpm dev:api:lan` for devices), demo seed
(`pnpm seed:demo`), Android emulator or physical device with a development build of
`com.rncf.launchpad`, Metro reachable from the device. Emulator URLs: `pnpm dev:android`. Phone /
Tailscale: `pnpm native:urls` then follow [Getting started](/getting-started/).

Install the [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli), then:

```bash
# Password is the value printed by pnpm seed:demo (local seed constant; do not commit secrets).
maestro test .maestro/sign-in-account.yaml \
  -e DEMO_EMAIL=owner@example.com \
  -e DEMO_PASSWORD='…'
```

Flows live in `.maestro/` at the repo root and prefer `testID` / Maestro `id:` selectors. Today that
is one smoke: sign-in → Account (`.maestro/sign-in-account.yaml`). Expand only for user-visible
native regressions Playwright cannot see (safe area, SecureStore session, deep links).

EAS Workflows can run the same flows after an `e2e-test` profile build; see Expo’s
[Maestro E2E example](https://docs.expo.dev/eas/workflows/examples/e2e-tests/). That path is optional,
paid, and **not wired** in this repo’s GitLab or `eas.json` — keep local emulator smoke free.

## Sources

- [Maestro — React Native](https://docs.maestro.dev/get-started/supported-platform/react-native)
- [Maestro — parameters / `-e`](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/parameters-and-constants)
- [Expo — EAS Workflows + Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
