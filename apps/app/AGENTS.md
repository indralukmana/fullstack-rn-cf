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

Focused check:

```bash
pnpm --filter @rn-cf/app typecheck
```
