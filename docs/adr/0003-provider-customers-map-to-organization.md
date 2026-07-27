# Provider customers map to Organization

Stripe and RevenueCat customer identity should key off the Organization, not the User who checked out. The User is only the actor. This matches Organization-owned Subscriptions and Active-Organization Entitlement checks. Today’s launchpad still uses `user.id` as provider subject; that is transitional. Native App User ID migration is expected to be hard and should be planned explicitly when implementation catches up — not by silently keeping User as the commercial subject.
