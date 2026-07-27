import { View } from "react-native";

import { Button, Field, Section } from "@/components/ui";

import type { OrganizationsScreenState } from "./use-organizations-screen";

type CreateOrganizationSectionProps = Pick<
  OrganizationsScreenState,
  "name" | "setName" | "slug" | "setSlug" | "pending" | "onCreate"
>;

export function CreateOrganizationSection({
  name,
  setName,
  slug,
  setSlug,
  pending,
  onCreate,
}: CreateOrganizationSectionProps) {
  return (
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
  );
}
