---
title: Native release runbook
description: EAS, App Store, Play, RevenueCat, testing, and rollback
---

The repository is build-ready, but no store or Expo account is provisioned by source control.
`com.rncf.launchpad` is a collision-resistant template identifier, not ownership of that listing.
Choose final identifiers before the first uploaded build; changing them later creates a different
store app.

## One-time provisioning

1. Create the Apple Developer, App Store Connect, Google Play, Expo/EAS, and RevenueCat projects.
2. Replace `name`, `slug`, `scheme`, `ios.bundleIdentifier`, and `android.package` in
   `apps/app/app.json` with the owned product identity.
3. From `apps/app`, run `eas init` and `eas update:configure`. These commands mutate the Expo
   project and local app config; review and commit the generated project ID and update URL.
4. Create monthly and yearly auto-renewing products in App Store Connect and Play Console. Attach
   both to RevenueCat's `pro` entitlement and configured offering, then set every server catalog
   ID and public SDK key.
5. Configure App Store Server Notifications and Google Real-time Developer Notifications in
   RevenueCat. Configure the authenticated RevenueCat webhook to the API.
6. Accept paid-app agreements and complete tax and banking setup. Purchases cannot launch while
   agreements are incomplete.
7. Add protected `EXPO_TOKEN` and store credential variables in GitLab. Never commit an App Store
   Connect API key, Google service-account JSON, signing certificate, or EAS token.
8. Configure each EAS environment with the non-sensitive Expo API URL, app URL, RevenueCat public
   SDK key, entitlement, and offering. Metro compiles these values into the app bundle; keep all
   provider secret keys in the Worker environment.

## Privacy and store declarations

- Review the generated iOS privacy manifest in every release. Declare data linked to the account,
  purchases, identifiers, diagnostics, and any analytics actually enabled.
- Complete App Privacy and Google Data Safety from observed runtime behavior, not marketing copy.
- Publish a privacy policy, terms, support URL, account-deletion path, and subscription terms.
- Explain that deleting an app account does not cancel Apple or Google billing, and provide
  platform management links before deletion.
- RevenueCat Customer Center requires iOS 15+, while this project targets iOS 16.4 because Expo 57
  requires it. Android targets API 24 or newer.
- As of July 2026, new Play apps and updates must use Play Billing Library 7+ by August 31, 2026
  (extension deadline November 1, 2026). Verify the generated AAB in Play Console; do not assume
  the wrapper SDK version proves compliance.

## Test matrix

Build `development` for device work and `preview` for release candidates. A passing web build does
not validate StoreKit or Play Billing.

| Flow                                       | Apple Sandbox/TestFlight | Google license/internal test |
| ------------------------------------------ | ------------------------ | ---------------------------- |
| New monthly/yearly purchase                | Required                 | Required                     |
| Renewal, cancellation, expiry              | Required                 | Required                     |
| Billing issue and grace period             | Required                 | Required                     |
| User-initiated restore                     | Required                 | Required                     |
| Account switch and transfer policy         | Required                 | Required                     |
| Refund/revocation                          | Required                 | Required                     |
| Offline launch and provider outage         | Required                 | Required                     |
| Native purchase unlocks web/other platform | Required                 | Required                     |

For every case, verify RevenueCat, the authenticated webhook event, D1 provider grant, aggregate
entitlement, `GET /api/billing/status`, and paid API authorization.

## Build, submit, and update

GitLab jobs are manual and default-branch-only:

- `native:preview` starts internal EAS builds.
- `native:production` starts signed production builds.
- `native:submit` uploads the latest builds. Keep App Store and Play production promotion manual.
- `native:update:preview` publishes preview OTA updates.
- `native:update:production` starts a production rollout at
  `EAS_ROLLOUT_PERCENTAGE` (default 10%).
- `native:update:rollback` requires `EAS_UPDATE_GROUP_ID` and republishes a previous update.

Fingerprint runtime versions prevent JavaScript built for one native binary from reaching an
incompatible binary. Never use OTA updates for native dependency, permission, privacy-manifest,
or billing SDK changes; ship a new store binary.

## Rollout and recovery

Promote first to TestFlight and Play internal testing, then staged store rollout. Watch crashes,
billing event failures, reconciliation failures, queue depth, refunds, and support contacts before
increasing exposure.

For a bad OTA rollout, stop or reduce the rollout and run the rollback job. For a bad binary, halt
store rollout, publish a fixed build, and use OTA only when the fault is purely JavaScript and
runtime-compatible. Never repair billing incidents by editing entitlement rows; replay or
reconcile provider state.
