import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-slate-700">Loading organizations…</Text>
      </View>
    );
  }

  if (!session?.user) {
    return (
      <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
        <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
          Organizations
        </Text>
        <Text className="text-slate-700">Sign in to manage organizations.</Text>
        <Link href="/sign-in" className="text-center font-semibold text-slate-900">
          Sign in
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-5 bg-slate-50 px-6 py-8">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Organizations
      </Text>

      <View className="gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">Your organizations</Text>
        {organizations.data?.length ? (
          organizations.data.map((organization) => {
            const active = organization.id === activeOrganization.data?.id;
            return (
              <Pressable
                key={organization.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: pending }}
                className={`rounded-lg border px-4 py-3 ${
                  active ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white"
                }`}
                disabled={pending || active}
                onPress={() => onSelect(organization.id)}
              >
                <Text className="font-semibold text-slate-900">{organization.name}</Text>
                <Text className="text-sm text-slate-500">
                  {organization.slug}
                  {active ? " · active" : ""}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text className="text-slate-600">Create your first organization below.</Text>
        )}
      </View>

      <View className="gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Text className="text-base font-semibold text-slate-900">Create organization</Text>
        <TextInput
          autoComplete="organization"
          className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
          onChangeText={setName}
          placeholder="Organization name"
          value={name}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
          onChangeText={setSlug}
          placeholder="organization-slug"
          value={slug}
        />
        {error ? (
          <Text accessibilityRole="alert" className="text-sm text-red-600">
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-slate-900 px-5 py-3"
          disabled={pending}
          onPress={onCreate}
        >
          <Text className="text-center font-semibold text-white">
            {pending ? "Saving…" : "Create organization"}
          </Text>
        </Pressable>
      </View>

      <Link href="/me" className="text-center text-slate-600">
        Back to account
      </Link>
    </View>
  );
}
