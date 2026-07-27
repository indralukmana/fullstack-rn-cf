# Organization close blocked while Subscription is active

Closing an Organization is blocked while its Subscription is active or in grace. Cancel or expire billing first, then close. We rejected “close anytime and cancel in providers as a side effect” because store subscriptions may keep charging and the product must not imply local close canceled Apple, Google, or Stripe. Soft-close-after-cancel can be a later UI state, but the domain rule is: no hard close over live billing.
