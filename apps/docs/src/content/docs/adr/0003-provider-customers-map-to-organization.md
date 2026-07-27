---
title: Provider customers map to Organization
description: ADR 0003 - Stripe and RevenueCat identity keys off Organization
---

Stripe and RevenueCat customer identity keys off the Organization, not the User who checked out.
Checkout writes immutable `organizationId` Stripe metadata. Native builds use the Organization id as
the RevenueCat App User ID and re-identify when the Active Organization changes. Native App User ID
migration for previously user-scoped store accounts must be planned explicitly (RevenueCat transfer
behavior) when upgrading an existing production install.

Canonical file for agents: `docs/adr/0003-provider-customers-map-to-organization.md`.
