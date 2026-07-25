import type { OrganizationOptions } from "better-auth/plugins";

export const organizationOptions = {
  allowUserToCreateOrganization: true,
  organizationLimit: 10,
  membershipLimit: 100,
  cancelPendingInvitationsOnReInvite: true,
  requireEmailVerificationOnInvitation: true,
} satisfies OrganizationOptions;
