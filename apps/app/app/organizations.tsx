import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  BodyText,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  LoadingScreen,
  QueryError,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  Section,
  StatusText,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { validateEmail } from "@/lib/validation";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function OrganizationsScreen() {
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

  async function onCreate() {
    const normalizedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedName) {
      setError("Organization name is required.");
      return;
    }
    if (
      normalizedSlug.length < 3 ||
      normalizedSlug.length > 48 ||
      !SLUG_PATTERN.test(normalizedSlug)
    ) {
      setError("Slug must be 3–48 lowercase letters, numbers, or single hyphens.");
      return;
    }

    setPending(true);
    setError(null);
    const created = await authClient.organization.create({
      name: normalizedName,
      slug: normalizedSlug,
    });

    if (created.error || !created.data) {
      setPending(false);
      setError(created.error?.message ?? "Could not create the organization.");
      return;
    }

    const selected = await authClient.organization.setActive({
      organizationId: created.data.id,
    });
    setPending(false);

    if (selected.error) {
      setError(selected.error.message ?? "Organization created, but could not be selected.");
      return;
    }

    setName("");
    setSlug("");
    await organizations.refetch();
    await activeOrganization.refetch();
  }

  async function onSelect(organizationId: string) {
    setPending(true);
    setError(null);
    setInviteMessage(null);
    const selected = await authClient.organization.setActive({ organizationId });
    setPending(false);

    if (selected.error) {
      setError(selected.error.message ?? "Could not select the organization.");
      return;
    }

    await activeOrganization.refetch();
  }

  async function onInvite() {
    const emailError = validateEmail(inviteEmail);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!activeOrganization.data?.id) {
      setError("Select an organization before inviting members.");
      return;
    }

    setPending(true);
    setError(null);
    setInviteMessage(null);
    const invited = await authClient.organization.inviteMember({
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    setPending(false);

    if (invited.error) {
      setError(invited.error.message ?? "Could not send the invitation.");
      return;
    }

    setInviteEmail("");
    setInviteMessage(`Invitation sent to ${inviteEmail.trim()}.`);
    await activeOrganization.refetch();
  }

  async function onCancelInvitation(invitationId: string) {
    setPending(true);
    setError(null);
    const cancelled = await authClient.organization.cancelInvitation({ invitationId });
    setPending(false);
    if (cancelled.error) {
      setError(cancelled.error.message ?? "Could not cancel the invitation.");
      return;
    }
    await activeOrganization.refetch();
  }

  async function onLeaveOrganization() {
    if (!activeOrganization.data?.id) {
      return;
    }
    setPending(true);
    setError(null);
    const left = await authClient.organization.leave({
      organizationId: activeOrganization.data.id,
    });
    setPending(false);
    setConfirmLeaveOrg(false);
    if (left.error) {
      setError(left.error.message ?? "Could not leave the organization.");
      return;
    }
    await organizations.refetch();
    await activeOrganization.refetch();
  }

  async function onDeleteOrganization() {
    if (!activeOrganization.data?.id) {
      return;
    }
    setPending(true);
    setError(null);
    const deleted = await authClient.organization.delete({
      organizationId: activeOrganization.data.id,
    });
    setPending(false);
    setConfirmDeleteOrg(false);
    if (deleted.error) {
      setError(
        deleted.error.message ??
          "Could not close the organization. Cancel any active subscription first.",
      );
      return;
    }
    await organizations.refetch();
    await activeOrganization.refetch();
  }

  async function onRemoveMember(memberId: string) {
    setPending(true);
    setError(null);
    const removed = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
    });
    setPending(false);
    setMemberPendingRemoval(null);
    if (removed.error) {
      setError(removed.error.message ?? "Could not remove the member.");
      return;
    }
    await activeOrganization.refetch();
  }

  async function onTransferOwnership(memberId: string) {
    if (!myMembership) {
      return;
    }
    setPending(true);
    setError(null);
    const promoted = await authClient.organization.updateMemberRole({
      memberId,
      role: "owner",
    });
    if (promoted.error) {
      setPending(false);
      setMemberPendingTransfer(null);
      setError(promoted.error.message ?? "Could not transfer ownership.");
      return;
    }
    const demoted = await authClient.organization.updateMemberRole({
      memberId: myMembership.id,
      role: "admin",
    });
    setPending(false);
    setMemberPendingTransfer(null);
    if (demoted.error) {
      setError(
        demoted.error.message ??
          "Ownership was granted, but your role could not be demoted. Demote yourself manually.",
      );
      await activeOrganization.refetch();
      return;
    }
    await activeOrganization.refetch();
  }

  if (sessionPending || organizations.isPending || activeOrganization.isPending) {
    return <LoadingScreen label="Loading organizations…" />;
  }

  if (organizations.error || activeOrganization.error) {
    return (
      <Screen centered>
        <ScreenTitle>Organizations</ScreenTitle>
        <QueryError
          message="Could not load organizations."
          onRetry={() => {
            void organizations.refetch();
            void activeOrganization.refetch();
          }}
        />
      </Screen>
    );
  }

  if (!session?.user) {
    return (
      <Screen centered>
        <ScreenTitle>Organizations</ScreenTitle>
        <ScreenLead>Sign in to manage organizations.</ScreenLead>
        <Link href="/sign-in" asChild>
          <Button label="Sign in" />
        </Link>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenTitle>Organizations</ScreenTitle>

      <Section title="Your organizations">
        {organizations.data?.length ? (
          <View className="gap-2">
            {organizations.data.map((organization) => {
              const active = organization.id === activeOrganization.data?.id;
              return (
                <Pressable
                  key={organization.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: pending }}
                  className={`rounded-lg border px-4 py-3.5 ${
                    active ? "border-foreground bg-selected" : "border-border bg-elevated"
                  }`}
                  disabled={pending || active}
                  onPress={() => onSelect(organization.id)}
                >
                  <BodyText className="text-foreground" weight="semibold">
                    {organization.name}
                  </BodyText>
                  <BodyText className="text-sm text-foreground-muted">
                    {organization.slug}
                    {active ? " · active" : ""}
                  </BodyText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState
            description="You should already have a personal organization from signup. Create another below if you need a separate workspace."
            title="No organizations listed"
          />
        )}
      </Section>

      {activeOrganization.data ? (
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
      ) : null}

      {activeOrganization.data ? (
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
      ) : null}

      {activeOrganization.data && canManageMembers ? (
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
                  <BodyText className="text-sm text-foreground-muted">
                    Role: {invitation.role}
                  </BodyText>
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
      ) : null}

      <Section title="Create another organization">
        <View className="gap-3">
          <Field
            autoComplete="organization"
            label="Organization name"
            onChangeText={setName}
            placeholder="Organization name"
            value={name}
          />
          <Field
            autoCapitalize="none"
            autoCorrect={false}
            label="Slug"
            onChangeText={setSlug}
            placeholder="organization-slug"
            value={slug}
          />
          <Button
            disabled={pending}
            label={pending ? "Saving…" : "Create organization"}
            onPress={onCreate}
          />
        </View>
      </Section>

      {error ? <StatusText>{error}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>

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
    </Screen>
  );
}
