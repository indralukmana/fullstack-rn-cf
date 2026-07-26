import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    members: r.many.member({
      from: r.user.id,
      to: r.member.userId,
    }),
    invitations: r.many.invitation({
      from: r.user.id,
      to: r.invitation.inviterId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  organization: {
    members: r.many.member({
      from: r.organization.id,
      to: r.member.organizationId,
    }),
    invitations: r.many.invitation({
      from: r.organization.id,
      to: r.invitation.organizationId,
    }),
  },
  member: {
    organization: r.one.organization({
      from: r.member.organizationId,
      to: r.organization.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.member.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  invitation: {
    organization: r.one.organization({
      from: r.invitation.organizationId,
      to: r.organization.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.invitation.inviterId,
      to: r.user.id,
      optional: false,
    }),
  },
  billingCustomer: {
    subscriptions: r.many.subscription({
      from: r.billingCustomer.id,
      to: r.subscription.billingCustomerId,
    }),
  },
  subscription: {
    customer: r.one.billingCustomer({
      from: r.subscription.billingCustomerId,
      to: r.billingCustomer.id,
      optional: false,
    }),
    entitlements: r.many.entitlement({
      from: r.subscription.id,
      to: r.entitlement.sourceSubscriptionId,
    }),
    grants: r.many.providerGrant({
      from: r.subscription.id,
      to: r.providerGrant.subscriptionId,
    }),
  },
  entitlement: {
    subscription: r.one.subscription({
      from: r.entitlement.sourceSubscriptionId,
      to: r.subscription.id,
    }),
  },
  providerGrant: {
    customer: r.one.billingCustomer({
      from: r.providerGrant.billingCustomerId,
      to: r.billingCustomer.id,
    }),
    subscription: r.one.subscription({
      from: r.providerGrant.subscriptionId,
      to: r.subscription.id,
    }),
  },
}));
