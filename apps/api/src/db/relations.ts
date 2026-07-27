import { defineRelations, type ExtractTablesFromSchema, type RelationsBuilder } from "drizzle-orm";

import * as schema from "./schema";

type SchemaTables = ExtractTablesFromSchema<typeof schema>;

export function authRelations(r: RelationsBuilder<SchemaTables>) {
  return {
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
  };
}

export function organizationRelations(r: RelationsBuilder<SchemaTables>) {
  return {
    organization: {
      members: r.many.member({
        from: r.organization.id,
        to: r.member.organizationId,
      }),
      invitations: r.many.invitation({
        from: r.organization.id,
        to: r.invitation.organizationId,
      }),
      featureItems: r.many.featureItem({
        from: r.organization.id,
        to: r.featureItem.organizationId,
      }),
    },
    featureItem: {
      organization: r.one.organization({
        from: r.featureItem.organizationId,
        to: r.organization.id,
        optional: false,
      }),
      createdBy: r.one.user({
        from: r.featureItem.createdByUserId,
        to: r.user.id,
        optional: false,
      }),
    },
  };
}

export function billingRelations(r: RelationsBuilder<SchemaTables>) {
  return {
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
  };
}

export const relations = defineRelations(schema, (r) => ({
  ...authRelations(r),
  ...organizationRelations(r),
  ...billingRelations(r),
}));
