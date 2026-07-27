import { View } from "react-native";

import { BodyText, Button, Section } from "@/components/ui";

import type { OrganizationsScreenState } from "./use-organizations-screen";

type MembershipActionsSectionProps = Pick<
  OrganizationsScreenState,
  | "activeOrganization"
  | "canLeave"
  | "isOwner"
  | "canDeleteOrganization"
  | "pending"
  | "setConfirmLeaveOrg"
  | "setConfirmDeleteOrg"
>;

export function MembershipActionsSection({
  activeOrganization,
  canLeave,
  isOwner,
  canDeleteOrganization,
  pending,
  setConfirmLeaveOrg,
  setConfirmDeleteOrg,
}: MembershipActionsSectionProps) {
  if (!activeOrganization.data) {
    return null;
  }

  return (
    <Section title="Membership actions">
      <View className="gap-3">
        <BodyText className="text-sm leading-5 text-foreground-secondary">
          Leaving ends access to this organization&apos;s Pro entitlement. Closing deletes the
          organization after any subscription is canceled.
        </BodyText>
        {canLeave ? (
          <Button
            disabled={pending}
            label="Leave organization"
            onPress={() => setConfirmLeaveOrg(true)}
            variant="secondary"
          />
        ) : isOwner ? (
          <BodyText className="text-sm text-foreground-muted">
            Transfer ownership or close the organization before leaving as the sole owner.
          </BodyText>
        ) : null}
        {canDeleteOrganization ? (
          <Button
            disabled={pending}
            label="Close organization"
            onPress={() => setConfirmDeleteOrg(true)}
            variant="danger"
          />
        ) : null}
      </View>
    </Section>
  );
}
