import { authClient } from "@/lib/auth-client";
import { validateEmail } from "@/lib/validation";

import { SLUG_PATTERN } from "./constants";

type OrganizationLists = {
  refetch: () => Promise<unknown>;
};

type ActiveOrganization = OrganizationLists & {
  data?: { id: string } | null;
};

export async function createOrganization(input: {
  name: string;
  slug: string;
  organizations: OrganizationLists;
  activeOrganization: ActiveOrganization;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setName: (value: string) => void;
  setSlug: (value: string) => void;
}) {
  const normalizedName = input.name.trim();
  const normalizedSlug = input.slug.trim().toLowerCase();
  if (!normalizedName) {
    input.setError("Organization name is required.");
    return;
  }
  if (
    normalizedSlug.length < 3 ||
    normalizedSlug.length > 48 ||
    !SLUG_PATTERN.test(normalizedSlug)
  ) {
    input.setError("Slug must be 3–48 lowercase letters, numbers, or single hyphens.");
    return;
  }

  input.setPending(true);
  input.setError(null);
  const created = await authClient.organization.create({
    name: normalizedName,
    slug: normalizedSlug,
  });

  if (created.error || !created.data) {
    input.setPending(false);
    input.setError(created.error?.message ?? "Could not create the organization.");
    return;
  }

  const selected = await authClient.organization.setActive({
    organizationId: created.data.id,
  });
  input.setPending(false);

  if (selected.error) {
    input.setError(selected.error.message ?? "Organization created, but could not be selected.");
    return;
  }

  input.setName("");
  input.setSlug("");
  await input.organizations.refetch();
  await input.activeOrganization.refetch();
}

export async function selectOrganization(input: {
  organizationId: string;
  activeOrganization: ActiveOrganization;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setInviteMessage: (value: string | null) => void;
}) {
  input.setPending(true);
  input.setError(null);
  input.setInviteMessage(null);
  const selected = await authClient.organization.setActive({
    organizationId: input.organizationId,
  });
  input.setPending(false);

  if (selected.error) {
    input.setError(selected.error.message ?? "Could not select the organization.");
    return;
  }

  await input.activeOrganization.refetch();
}

export async function inviteOrganizationMember(input: {
  inviteEmail: string;
  inviteRole: "member" | "admin";
  activeOrganization: ActiveOrganization;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setInviteMessage: (value: string | null) => void;
  setInviteEmail: (value: string) => void;
}) {
  const emailError = validateEmail(input.inviteEmail);
  if (emailError) {
    input.setError(emailError);
    return;
  }
  if (!input.activeOrganization.data?.id) {
    input.setError("Select an organization before inviting members.");
    return;
  }

  input.setPending(true);
  input.setError(null);
  input.setInviteMessage(null);
  const invited = await authClient.organization.inviteMember({
    email: input.inviteEmail.trim(),
    role: input.inviteRole,
  });
  input.setPending(false);

  if (invited.error) {
    input.setError(invited.error.message ?? "Could not send the invitation.");
    return;
  }

  input.setInviteEmail("");
  input.setInviteMessage(`Invitation sent to ${input.inviteEmail.trim()}.`);
  await input.activeOrganization.refetch();
}

export async function cancelOrganizationInvitation(input: {
  invitationId: string;
  activeOrganization: ActiveOrganization;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
}) {
  input.setPending(true);
  input.setError(null);
  const cancelled = await authClient.organization.cancelInvitation({
    invitationId: input.invitationId,
  });
  input.setPending(false);
  if (cancelled.error) {
    input.setError(cancelled.error.message ?? "Could not cancel the invitation.");
    return;
  }
  await input.activeOrganization.refetch();
}

export async function leaveOrganization(input: {
  activeOrganization: ActiveOrganization;
  organizations: OrganizationLists;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setConfirmLeaveOrg: (value: boolean) => void;
}) {
  if (!input.activeOrganization.data?.id) {
    return;
  }
  input.setPending(true);
  input.setError(null);
  const left = await authClient.organization.leave({
    organizationId: input.activeOrganization.data.id,
  });
  input.setPending(false);
  input.setConfirmLeaveOrg(false);
  if (left.error) {
    input.setError(left.error.message ?? "Could not leave the organization.");
    return;
  }
  await input.organizations.refetch();
  await input.activeOrganization.refetch();
}

export async function deleteOrganization(input: {
  activeOrganization: ActiveOrganization;
  organizations: OrganizationLists;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setConfirmDeleteOrg: (value: boolean) => void;
}) {
  if (!input.activeOrganization.data?.id) {
    return;
  }
  input.setPending(true);
  input.setError(null);
  const deleted = await authClient.organization.delete({
    organizationId: input.activeOrganization.data.id,
  });
  input.setPending(false);
  input.setConfirmDeleteOrg(false);
  if (deleted.error) {
    input.setError(
      deleted.error.message ??
        "Could not close the organization. Cancel any active subscription first.",
    );
    return;
  }
  await input.organizations.refetch();
  await input.activeOrganization.refetch();
}

export async function removeOrganizationMember(input: {
  memberId: string;
  activeOrganization: ActiveOrganization;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setMemberPendingRemoval: (value: { id: string; label: string } | null) => void;
}) {
  input.setPending(true);
  input.setError(null);
  const removed = await authClient.organization.removeMember({
    memberIdOrEmail: input.memberId,
  });
  input.setPending(false);
  input.setMemberPendingRemoval(null);
  if (removed.error) {
    input.setError(removed.error.message ?? "Could not remove the member.");
    return;
  }
  await input.activeOrganization.refetch();
}

export async function transferOrganizationOwnership(input: {
  memberId: string;
  myMembership: { id: string } | undefined;
  activeOrganization: ActiveOrganization;
  setPending: (value: boolean) => void;
  setError: (value: string | null) => void;
  setMemberPendingTransfer: (value: { id: string; label: string } | null) => void;
}) {
  if (!input.myMembership) {
    return;
  }
  input.setPending(true);
  input.setError(null);
  const promoted = await authClient.organization.updateMemberRole({
    memberId: input.memberId,
    role: "owner",
  });
  if (promoted.error) {
    input.setPending(false);
    input.setMemberPendingTransfer(null);
    input.setError(promoted.error.message ?? "Could not transfer ownership.");
    return;
  }
  const demoted = await authClient.organization.updateMemberRole({
    memberId: input.myMembership.id,
    role: "admin",
  });
  input.setPending(false);
  input.setMemberPendingTransfer(null);
  if (demoted.error) {
    input.setError(
      demoted.error.message ??
        "Ownership was granted, but your role could not be demoted. Demote yourself manually.",
    );
    await input.activeOrganization.refetch();
    return;
  }
  await input.activeOrganization.refetch();
}
