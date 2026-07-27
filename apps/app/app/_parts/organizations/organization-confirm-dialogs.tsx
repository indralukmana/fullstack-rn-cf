import { ConfirmDialog } from "@/components/ui";

import type { OrganizationsScreenState } from "./use-organizations-screen";

type OrganizationConfirmDialogsProps = Pick<
  OrganizationsScreenState,
  | "confirmLeaveOrg"
  | "setConfirmLeaveOrg"
  | "confirmDeleteOrg"
  | "setConfirmDeleteOrg"
  | "memberPendingRemoval"
  | "setMemberPendingRemoval"
  | "memberPendingTransfer"
  | "setMemberPendingTransfer"
  | "pending"
  | "onLeaveOrganization"
  | "onDeleteOrganization"
  | "onRemoveMember"
  | "onTransferOwnership"
>;

export function OrganizationConfirmDialogs({
  confirmLeaveOrg,
  setConfirmLeaveOrg,
  confirmDeleteOrg,
  setConfirmDeleteOrg,
  memberPendingRemoval,
  setMemberPendingRemoval,
  memberPendingTransfer,
  setMemberPendingTransfer,
  pending,
  onLeaveOrganization,
  onDeleteOrganization,
  onRemoveMember,
  onTransferOwnership,
}: OrganizationConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        cancelLabel="Keep membership"
        confirmLabel="Leave"
        destructive
        message="You will lose access to this organization's entitlement until invited again."
        onCancel={() => setConfirmLeaveOrg(false)}
        onConfirm={() => void onLeaveOrganization()}
        pending={pending}
        title="Leave organization?"
        visible={confirmLeaveOrg}
      />
      <ConfirmDialog
        cancelLabel="Keep organization"
        confirmLabel="Close"
        destructive
        message="This permanently removes the organization and memberships. Cancel any active subscription first."
        onCancel={() => setConfirmDeleteOrg(false)}
        onConfirm={() => void onDeleteOrganization()}
        pending={pending}
        title="Close organization?"
        visible={confirmDeleteOrg}
      />
      <ConfirmDialog
        cancelLabel="Keep member"
        confirmLabel="Remove"
        destructive
        message={
          memberPendingRemoval
            ? `Remove ${memberPendingRemoval.label} from this organization?`
            : "Remove this member?"
        }
        onCancel={() => setMemberPendingRemoval(null)}
        onConfirm={() => {
          if (memberPendingRemoval) {
            void onRemoveMember(memberPendingRemoval.id);
          }
        }}
        pending={pending}
        title="Remove member?"
        visible={Boolean(memberPendingRemoval)}
      />
      <ConfirmDialog
        cancelLabel="Keep ownership"
        confirmLabel="Transfer"
        destructive
        message={
          memberPendingTransfer
            ? `Make ${memberPendingTransfer.label} the owner? You will become an admin.`
            : "Transfer ownership?"
        }
        onCancel={() => setMemberPendingTransfer(null)}
        onConfirm={() => {
          if (memberPendingTransfer) {
            void onTransferOwnership(memberPendingTransfer.id);
          }
        }}
        pending={pending}
        title="Transfer ownership?"
        visible={Boolean(memberPendingTransfer)}
      />
    </>
  );
}
