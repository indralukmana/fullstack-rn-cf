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

Use the printed password with `owner@example.com` / `member@example.com`.

## Android emulator (local)

Recipe — run steps in order; adapt if a check already passes.

1. API on the host: `pnpm dev:api` (loopback is fine for the emulator).
2. `pnpm seed:demo` once.
3. First install or after native dependency changes:
   `pnpm dev:android -- --run` (Gradle build; can take a long time once).
4. Later sessions: `pnpm dev:android` (Metro + open the installed dev client).
5. Emulator URLs are `http://10.0.2.2:8787` and `http://10.0.2.2:8081` (set by
   `dev:android`). Do not point the emulator at `127.0.0.1` — that is the emulator itself.

Native UI smoke (optional): see [Testing](/testing/) and `.maestro/`.

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
   `apps/app/.env.local`. Restart Metro after changes.

4. Merge the printed origin into `apps/api/.env.local` `CORS_ORIGINS` (comma-separated, no path,
   no trailing slash). Keep existing localhost / `10.0.2.2` entries if you still use web or the
   emulator.

5. Start Metro with a host the phone can dial, for example:

   ```bash
   pnpm --filter @rn-cf/app exec expo start --lan --port 8081
   ```

   Tailscale: use the `100.x` URLs from `native:urls`; phone and PC must be on the tailnet.
   Install the same development build once (`expo run:android` / Xcode), then reload against Metro.

6. Verify: from the phone’s browser open `http://<host>:8787` (API) and confirm the app loads JS
   from `http://<host>:8081`. Wrong CORS or still-bound `127.0.0.1` API are the usual failures.

Details and agent procedure: [Environment](/environment/), `apps/app/AGENTS.md`.

Next: [Derive a product](/derive-a-product/) when turning this scaffold into a named app,
[Domain language](/domain/) for shared vocabulary, and [Agent guardrails](/agent-guardrails/) when
coding agents work in the repo.
