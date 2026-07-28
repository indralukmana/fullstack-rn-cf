# App Agent Instructions

These instructions extend the root `AGENTS.md` for the Expo application.

- Preserve universal behavior across web, iOS, and Android. Isolate platform-specific code
  behind `Platform` checks or platform files.
- Read `DESIGN.md` in this package before visual or layout changes. Prefer Uniwind utilities and
  keep web-only DOM patterns out of shared screens.
- Keep route screens thin. Extract hooks, actions, and sections under `src/parts/` when a screen
  would trip oxlint modularity limits; do not disable those rules.
- Use Expo Router for navigation, TanStack Query for server state, and the generated API client
  for documented API operations.
- Keep auth credentials in Better Auth's platform integration and native SecureStore. Never
  persist secrets in AsyncStorage, logs, URLs, or source.
- Treat server entitlements as authoritative. RevenueCat purchase state initiates and displays
  flows but does not directly unlock protected server capabilities.
- Implement loading, empty, error, offline, and accessibility states for customer-facing flows.
- Do not introduce web-only DOM APIs into shared components without a native-safe boundary.
- Native purchase, deep-link, and release changes require sandbox/device verification notes.
- Prefer **recipes** (docs + this procedure) over mega-scripts that start API, Gradle, Metro, and
  Maestro in one process — those go stale when Expo/ADB/UI change.

## Agent procedure: native smoke (emulator)

Adapt; skip steps that already pass. Human docs: Starlight **Getting started** / **Testing**.

1. Confirm API on host port `8787` (`pnpm dev:api` if needed). Seed with `pnpm seed:demo`; use the
   printed password (never commit it into Maestro YAML).
2. Emulator URLs: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8787` and
   `EXPO_PUBLIC_APP_URL=http://10.0.2.2:8081` via `pnpm dev:android` (or `-- --run` for first
   install / native dep changes).
3. App id / scheme from `app.json` (`com.rncf.launchpad`, scheme `rncf`). Deep links use that
   scheme — do not invent alternate scheme strings.
4. Maestro (optional): target `testID`s (`auth-email`, `auth-password`, `auth-sign-in-submit`,
   `home-account`, `account-sign-out`, …) via `id:` in `.maestro/sign-in-account.yaml`.
   `maestro test .maestro/sign-in-account.yaml -e DEMO_PASSWORD='…'`.
5. On failure: check CORS includes `http://10.0.2.2:8081`, API not only broken on web, and Metro
   restarted after env changes.

## Agent procedure: physical device (Wi‑Fi or Tailscale)

1. `pnpm native:urls` (or `--prefer lan` / `--prefer tailscale`) — print-only; copy suggestions.
2. `pnpm dev:api:lan` so the API listens on `0.0.0.0:8787`.
3. Apply printed `EXPO_PUBLIC_*` in the shell or ignored `apps/app/.env.local`; merge printed app
   origin into `apps/api/.env.local` `CORS_ORIGINS`.
4. Start Metro with a reachable host (`expo start --lan` or Tailscale host URLs). Install/open the
   development build on the device; do not use emulator `10.0.2.2` URLs on a phone.
5. Verify from the device browser that `http://<host>:8787` responds before chasing app bugs.

Focused check:

```bash
pnpm --filter @rn-cf/app typecheck
```
