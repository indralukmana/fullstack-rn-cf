import { useState } from "react";

import { authClient } from "@/lib/auth-client";

import {
  cancelOrganizationInvitation,
  createOrganization,
  deleteOrganization,
  inviteOrganizationMember,
  leaveOrganization,
  removeOrganizationMember,
  selectOrganization,
  transferOrganizationOwnership,
} from "./organization-actions";

export function useOrganizationsScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState(false);
  const [confirmLeaveOrg, setConfirmLeaveOrg] = useState(false);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [memberPendingTransfer, setMemberPendingTransfer] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const members = activeOrganization.data?.members ?? [];
  const invitations = activeOrganization.data?.invitations ?? [];
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const myMembership = members.find((member) => member.userId === session?.user.id);
  const canManageMembers = myMembership?.role === "owner" || myMembership?.role === "admin";
  const isOwner = myMembership?.role === "owner";
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const canLeave = Boolean(myMembership) && !(isOwner && ownerCount <= 1);
  const canDeleteOrganization = isOwner;

  const actionContext = {
    organizations,
    activeOrganization,
    setPending,
    setError,
    setInviteMessage,
    setConfirmLeaveOrg,
    setConfirmDeleteOrg,
    setMemberPendingRemoval,
    setMemberPendingTransfer,
  };

  return {
    session,
    sessionPending,
    organizations,
    activeOrganization,
    name,
    setName,
    slug,
    setSlug,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    pending,
    error,
    inviteMessage,
    confirmDeleteOrg,
    setConfirmDeleteOrg,
    confirmLeaveOrg,
    setConfirmLeaveOrg,
    memberPendingRemoval,
    setMemberPendingRemoval,
    memberPendingTransfer,
    setMemberPendingTransfer,
    members,
    pendingInvitations,
    myMembership,
    canManageMembers,
    isOwner,
    ownerCount,
    canLeave,
    canDeleteOrganization,
    onCreate: () => createOrganization({ ...actionContext, name, slug, setName, setSlug }),
    onSelect: (organizationId: string) => selectOrganization({ ...actionContext, organizationId }),
    onInvite: () =>
      inviteOrganizationMember({
        ...actionContext,
        inviteEmail,
        inviteRole,
        setInviteEmail,
      }),
    onCancelInvitation: (invitationId: string) =>
      cancelOrganizationInvitation({ ...actionContext, invitationId }),
    onLeaveOrganization: () => leaveOrganization(actionContext),
    onDeleteOrganization: () => deleteOrganization(actionContext),
    onRemoveMember: (memberId: string) => removeOrganizationMember({ ...actionContext, memberId }),
    onTransferOwnership: (memberId: string) =>
      transferOrganizationOwnership({ ...actionContext, memberId, myMembership }),
  };
}

export type OrganizationsScreenState = ReturnType<typeof useOrganizationsScreen>;
