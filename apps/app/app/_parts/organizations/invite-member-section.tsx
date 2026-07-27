import { Pressable, View } from "react-native";

import { BodyText, Button, Field, Section, StatusText } from "@/components/ui";

import type { OrganizationsScreenState } from "./use-organizations-screen";

type InviteMemberSectionProps = Pick<
  OrganizationsScreenState,
  | "activeOrganization"
  | "canManageMembers"
  | "inviteEmail"
  | "setInviteEmail"
  | "inviteRole"
  | "setInviteRole"
  | "inviteMessage"
  | "pending"
  | "pendingInvitations"
  | "onInvite"
  | "onCancelInvitation"
>;

export function InviteMemberSection({
  activeOrganization,
  canManageMembers,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteMessage,
  pending,
  pendingInvitations,
  onInvite,
  onCancelInvitation,
}: InviteMemberSectionProps) {
  if (!activeOrganization.data || !canManageMembers) {
    return null;
  }

  return (
    <Section title="Invite member">
      <View className="gap-3">
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setInviteEmail}
          placeholder="teammate@example.com"
          value={inviteEmail}
        />
        <View className="flex-row gap-2">
          {(["member", "admin"] as const).map((role) => {
            const selected = inviteRole === role;
            return (
              <Pressable
                key={role}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className={`rounded-lg border px-3 py-2 ${
                  selected ? "border-foreground bg-selected" : "border-border bg-elevated"
                }`}
                onPress={() => setInviteRole(role)}
              >
                <BodyText className="capitalize text-foreground" weight="semibold">
                  {role}
                </BodyText>
              </Pressable>
            );
          })}
        </View>
        {inviteMessage ? <StatusText tone="success">{inviteMessage}</StatusText> : null}
        <Button
          disabled={pending}
          label={pending ? "Sending…" : "Send invitation"}
          onPress={onInvite}
        />
      </View>
      {pendingInvitations.length ? (
        <View className="mt-3 gap-2">
          <BodyText className="text-sm text-foreground-muted" weight="semibold">
            Pending invitations
          </BodyText>
          {pendingInvitations.map((invitation) => (
            <View
              key={invitation.id}
              className="gap-2 rounded-lg border border-border bg-elevated px-4 py-3"
            >
              <BodyText className="text-foreground">{invitation.email}</BodyText>
              <BodyText className="text-sm text-foreground-muted">Role: {invitation.role}</BodyText>
              <Button
                disabled={pending}
                label="Cancel invitation"
                onPress={() => void onCancelInvitation(invitation.id)}
                variant="secondary"
              />
            </View>
          ))}
        </View>
      ) : null}
    </Section>
  );
}
