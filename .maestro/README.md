# Maestro native smoke

Black-box flows for the Expo development / release binary (`com.rncf.launchpad`).
Web customer flows stay in `apps/e2e` (Playwright). See Starlight **Testing**.

## Prerequisites

1. Local API: `pnpm dev:api`
2. Demo users: `pnpm seed:demo` (prints the shared password)
3. Emulator/simulator with a development build installed (`pnpm dev:android` or equivalent)
4. [Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli)

## Run

```bash
maestro test .maestro/sign-in-account.yaml \
  -e DEMO_EMAIL=owner@example.com \
  -e DEMO_PASSWORD='…'   # value printed by pnpm seed:demo
```

Do not commit passwords. Prefer `-e` / `MAESTRO_*` env injection.
