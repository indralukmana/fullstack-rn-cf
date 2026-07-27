import type { OrganizationOptions } from "better-auth/plugins";

import type { AppBindings } from "../config";
import type { EmailEnv } from "../email/send";

import { sendEmail } from "../email/send";
import {
  assertOrganizationCanBeDeleted,
  type OrganizationLifecycleEnv,
} from "../organization/lifecycle";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type OrganizationOptionsEnv = EmailEnv &
  Partial<AppBindings> & {
    DB?: D1Database;
  };

function hasLifecycleBindings(env: OrganizationOptionsEnv): env is OrganizationLifecycleEnv {
  return Boolean(env.DB);
}

export function createOrganizationOptions(
  env: OrganizationOptionsEnv,
  appUrl: string,
): OrganizationOptions {
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
    organizationHooks: hasLifecycleBindings(env)
      ? {
          beforeDeleteOrganization: async ({ organization }) => {
            await assertOrganizationCanBeDeleted(env, organization.id);
          },
        }
      : undefined,
  };
}
