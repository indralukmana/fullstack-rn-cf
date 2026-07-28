# Playbook: native-dx

Emulator, physical device (Wi‑Fi / Tailscale), Metro URLs, Maestro smoke.

## Skills to load

- None required beyond Contract. Optional: Expo `expo-dev-client` if changing native install flows.

## Recipes (steps live here — do not duplicate)

- Starlight **Getting started** / **Environment** / **Testing**
- `apps/app/AGENTS.md` — agent procedures for emulator and device
- `.maestro/README.md` — Maestro invocation
- Print-only: `pnpm native:urls`; API bind: `pnpm dev:api:lan`

## Subagents

Allowed: one explore/research Subagent for primary-source Expo/Maestro docs when stuck.  
Not allowed: Subagent that deploys, pushes, or edits secrets.

## Done when

Device or emulator path is verified (health and/or UI), or the blocker is named with the next human
or Recipe step.
