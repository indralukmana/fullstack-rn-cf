import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
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

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function OrganizationsScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const selected = await authClient.organization.setActive({ organizationId });
    setPending(false);

    if (selected.error) {
      setError(selected.error.message ?? "Could not select the organization.");
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
                  <Text className="font-semibold text-foreground">{organization.name}</Text>
                  <Text className="text-sm text-foreground-muted">
                    {organization.slug}
                    {active ? " · active" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState
            description="Create an organization below to collaborate and invite members."
            title="No organizations yet"
          />
        )}
      </Section>

      <Section title="Create organization">
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
          {error ? <StatusText>{error}</StatusText> : null}
          <Button
            disabled={pending}
            label={pending ? "Saving…" : "Create organization"}
            onPress={onCreate}
          />
        </View>
      </Section>

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
