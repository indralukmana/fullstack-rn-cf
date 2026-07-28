---
title: Getting started
description: Install and run the RN CF scaffold on web and native
---

## Prerequisites

- Node.js 24+
- pnpm 11
- For Android: Android Studio emulator **or** a physical device on the same Wi‑Fi / Tailscale
  network as this machine
- For iOS Simulator: macOS + Xcode (optional)

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

## Demo users

With the API running:

```bash
pnpm seed:demo
```

Use the printed password with `owner@example.com` / `member@example.com`. Local seed uses a fixed
dev password (`demo-password-change-me` in the API seed module) until you change seeding.

## Android emulator (local)

Recipe — run steps in order; adapt if a check already passes.

1. API on the host: `pnpm dev:api` (loopback is fine for the emulator).
2. `pnpm seed:demo` once.
3. First install or after native dependency changes:
   `pnpm dev:android -- --run` (Gradle build; can take a long time once).
4. Later sessions: `pnpm dev:android` (Metro + open the installed dev client).
5. Emulator URLs are `http://10.0.2.2:8787` and `http://10.0.2.2:8081` (set by
   `dev:android`). Do not point the emulator at `127.0.0.1` — that is the emulator itself.

This app uses a **development client** (`expo-dev-client`), not Expo Go. Install via
`expo run:android` / `dev:android -- --run` before expecting the UI to load.

Native UI smoke (optional): see [Testing](/testing/) and `.maestro/`.

## iOS Simulator (macOS)

1. API: `pnpm dev:api` (Simulator can use host `127.0.0.1` / `localhost`).
2. `pnpm seed:demo` once.
3. First install: `pnpm --filter @rn-cf/app exec expo run:ios --port 8081` (or `pnpm dev:ios` when
   the client is already installed — confirm Metro URL is `http://127.0.0.1:8081`).
4. Default schema URLs (`127.0.0.1:8787` / `:8081`) are correct for the Simulator; do **not** use
   Android’s `10.0.2.2` here.
5. Same rule: development client, not Expo Go.

## Physical device (Wi‑Fi LAN or Tailscale)

Same development build, but the phone must reach **your machine’s** API and Metro over a routable
IPv4 (LAN or Tailscale). Prefer **recipes + `pnpm native:urls`** over hard-coded IPs in git.

1. Print candidates (does not write files):

   ```bash
   pnpm native:urls                  # prefers Tailscale if present, else LAN
   pnpm native:urls -- --prefer lan
   pnpm native:urls -- --prefer tailscale
   ```

2. API must listen beyond loopback: `pnpm dev:api:lan` (`0.0.0.0:8787`).

3. Put the printed `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_APP_URL` in the shell **or** in ignored
   `apps/app/.env.local`. Restart Metro after changes (include `--clear` if the bundle still points
   at emulator URLs).

4. Merge the printed origin into `apps/api/.env.local` `CORS_ORIGINS` (comma-separated, no path,
   no trailing slash). Keep existing localhost / `10.0.2.2` entries if you still use web or the
   emulator. Never commit `.env.local`.

5. Start Metro with Tailscale/LAN URLs exported, for example:

   ```bash
   export EXPO_PUBLIC_API_URL=http://<host>:8787
   export EXPO_PUBLIC_APP_URL=http://<host>:8081
   pnpm --filter @rn-cf/app exec expo start --lan --port 8081 --clear
   ```

   Phone and PC must share the tailnet (Tailscale) or LAN. Install the development build once,
   then connect the packager to `http://<host>:8081` / `exp://<host>:8081`.

6. Verify from the phone browser: `http://<host>:8787/health` must return JSON
   `{"status":"ok",...}` before debugging the app. Then confirm JS loads from `http://<host>:8081`.

Wrong CORS or an API still bound to `127.0.0.1` only (`pnpm dev:api` instead of `dev:api:lan`) are
the usual failures. After a Tailscale session, switch back to `pnpm dev:api` for web/emulator if
you no longer need `0.0.0.0`.

Details and agent procedure: [Environment](/environment/), `apps/app/AGENTS.md`.

Next: [Derive a product](/derive-a-product/) when turning this scaffold into a named app,
[Domain language](/domain/) for shared vocabulary, and [Agent guardrails](/agent-guardrails/) when
coding agents work in the repo.
