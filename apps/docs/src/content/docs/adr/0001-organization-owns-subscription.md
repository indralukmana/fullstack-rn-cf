---
title: Organization owns the subscription
description: ADR 0001 — commercial subject is the Organization
---

The commercial subject is the Organization (including an Organization of one). User-scoped billing
in the current launchpad code is a transitional default, not the target domain model. We chose
Organization ownership so solo and multi-member products share one billing path; changing subject
later is costly, so the glossary leads and implementation is expected to catch up.

Canonical file for agents: `docs/adr/0001-organization-owns-subscription.md`.
