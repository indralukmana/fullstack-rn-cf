# Playbook: billing

Stripe, RevenueCat, Grants, Entitlement, webhooks, subscription surfaces.

## Skills to load

1. `launchpad-architecture` (billing invariants)
2. Then the matching vendor skill: `stripe-best-practices` / `stripe-docs`, or the relevant
   `revenuecat-*` / `integrate-revenuecat` skill

## Recipes

- Starlight **Billing**, **Billing operations**, ADRs 0001–0004
- Root `CONTEXT.md` — Organization owns Subscription; Entitlement is server-authoritative

## Subagents

Allowed: parallel explore of `apps/api` billing vs `apps/app` subscription UI when the change
crosses both.  
Not allowed: Subagent changing live catalog, webhooks to production, or store credentials.

## Done when

Server authorization path is correct (Entitlement / paid routes), and client UI does not grant
access on its own.
