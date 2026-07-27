---
title: Organization owns the subscription
description: ADR 0001 - Organization is the commercial billing subject
---

The commercial subject is the Organization (including an Organization of one). Solo and multi-member
products share one billing path: provider customers, grants, and Entitlement rows key off the
Organization; the User is only the actor. Paid API authorization and `GET /api/billing/status` use
the Active Organization.

Canonical file for agents: `docs/adr/0001-organization-owns-subscription.md`.
