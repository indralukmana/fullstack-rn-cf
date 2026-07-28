# Maestro native smoke

Black-box flows for the Expo development / release binary (`com.rncf.launchpad`).
Web customer flows stay in `apps/e2e` (Playwright). See Starlight **Testing** and
`apps/app/AGENTS.md` (agent procedures).

## Prerequisites

1. Local API: `pnpm dev:api` (emulator) or `pnpm dev:api:lan` (physical device)
2. Demo users: `pnpm seed:demo` (prints the shared password)
3. Emulator **or** phone with a development build; URLs:
   - Emulator: `pnpm dev:android`
   - Device Wi‑Fi / Tailscale: `pnpm native:urls` then apply printed env + CORS
4. [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli)

## Run

```bash
maestro test .maestro/sign-in-account.yaml \
  -e DEMO_EMAIL=owner@example.com \
  -e DEMO_PASSWORD='…'   # value printed by pnpm seed:demo
```

Selectors use `testID` → Maestro `id:` (`auth-email`, `home-account`, …). Do not commit passwords.
