import type { OrganizationOptions } from "better-auth/plugins";

import { sendEmail, type EmailEnv } from "../email/send";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createOrganizationOptions(env: EmailEnv, appUrl: string): OrganizationOptions {
  return {
    allowUserToCreateOrganization: true,
    organizationLimit: 10,
    membershipLimit: 100,
    cancelPendingInvitationsOnReInvite: true,
    requireEmailVerificationOnInvitation: true,
    sendInvitationEmail: async ({ id, email, organization, inviter }) => {
      const invitationUrl = new URL("/accept-invitation", appUrl);
      invitationUrl.searchParams.set("id", id);

      const inviterName = inviter.user.name;
      await sendEmail(env, {
        to: email,
        subject: `Join ${organization.name}`,
        text: `${inviterName} invited you to join ${organization.name}.\n\nAccept the invitation:\n${invitationUrl.href}\n\nIf you were not expecting this invitation, you can ignore this email.`,
        html: `<p>${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(organization.name)}</strong>.</p><p><a href="${escapeHtml(invitationUrl.href)}">Accept invitation</a></p><p>If you were not expecting this invitation, you can ignore this email.</p>`,
      });
    },
  };
}
