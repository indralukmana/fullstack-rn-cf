import { View } from "react-native";

import { BodyText, Button, EmptyState, Section } from "@/components/ui";

import type { OrganizationsScreenState } from "./use-organizations-screen";

type MembersSectionProps = Pick<
  OrganizationsScreenState,
  | "activeOrganization"
  | "members"
  | "session"
  | "canManageMembers"
  | "isOwner"
  | "ownerCount"
  | "pending"
  | "setMemberPendingRemoval"
  | "setMemberPendingTransfer"
>;

export function MembersSection({
  activeOrganization,
  members,
  session,
  canManageMembers,
  isOwner,
  ownerCount,
  pending,
  setMemberPendingRemoval,
  setMemberPendingTransfer,
}: MembersSectionProps) {
  if (!activeOrganization.data) {
    return null;
  }

  return (
    <Section title="Members">
      {members.length ? (
        <View className="gap-2">
          {members.map((member) => {
            const isSelf = member.userId === session?.user.id;
            const canRemove =
              canManageMembers && !isSelf && !(member.role === "owner" && ownerCount <= 1);
            const canTransfer = isOwner && !isSelf && member.role !== "owner";
            return (
              <View
                key={member.id}
                className="gap-2 rounded-lg border border-border bg-elevated px-4 py-3"
              >
                <BodyText className="text-foreground" weight="semibold">
                  {member.user.name}
                </BodyText>
                <BodyText className="text-sm text-foreground-muted">
                  {member.user.email} · {member.role}
                </BodyText>
                {canTransfer ? (
                  <Button
                    disabled={pending}
                    label="Transfer ownership"
                    onPress={() =>
                      setMemberPendingTransfer({
                        id: member.id,
                        label: member.user.email,
                      })
                    }
                    variant="secondary"
                  />
                ) : null}
                {canRemove ? (
                  <Button
                    disabled={pending}
                    label="Remove member"
                    onPress={() =>
                      setMemberPendingRemoval({
                        id: member.id,
                        label: member.user.email,
                      })
                    }
                    variant="secondary"
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="No members loaded"
          description="Refresh by reselecting the organization."
        />
      )}
    </Section>
  );
}
