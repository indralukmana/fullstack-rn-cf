import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  BodyText,
  Button,
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

  const members = activeOrganization.data?.members ?? [];
  const invitations = activeOrganization.data?.invitations ?? [];
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const canManageMembers = members.some(
    (member) =>
      member.userId === session?.user.id && (member.role === "owner" || member.role === "admin"),
  );

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
              {members.map((member) => (
                <View
                  key={member.id}
                  className="rounded-lg border border-border bg-elevated px-4 py-3"
                >
                  <BodyText className="text-foreground" weight="semibold">
                    {member.user.name}
                  </BodyText>
                  <BodyText className="text-sm text-foreground-muted">
                    {member.user.email} · {member.role}
                  </BodyText>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No members loaded"
              description="Refresh by reselecting the organization."
            />
          )}
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
    </Screen>
  );
}
