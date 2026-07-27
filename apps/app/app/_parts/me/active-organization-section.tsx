import { View } from "react-native";

import { BodyText, QueryError, QuietLink, Section } from "@/components/ui";

type ActiveOrganizationSectionProps = {
  activeOrganization: {
    isPending: boolean;
    error: unknown;
    data: { name: string; slug: string } | null;
    refetch: () => void;
  };
  membershipRole?: string;
};

export function ActiveOrganizationSection({
  activeOrganization,
  membershipRole,
}: ActiveOrganizationSectionProps) {
  return (
    <Section title="Active organization">
      {activeOrganization.isPending ? (
        <BodyText className="text-base text-foreground-secondary">Loading…</BodyText>
      ) : activeOrganization.error ? (
        <QueryError
          message="Could not load the active organization."
          onRetry={() => activeOrganization.refetch()}
        />
      ) : activeOrganization.data ? (
        <View className="gap-2">
          <BodyText className="text-lg text-foreground" weight="semibold">
            {activeOrganization.data.name}
          </BodyText>
          <BodyText className="text-sm text-foreground-muted">
            {activeOrganization.data.slug}
            {membershipRole ? ` · ${membershipRole}` : ""}
          </BodyText>
          <QuietLink href="/organizations">Switch organization</QuietLink>
        </View>
      ) : (
        <View className="gap-2">
          <BodyText className="text-base text-foreground-secondary">
            No active organization.
          </BodyText>
          <QuietLink href="/organizations">Choose organization</QuietLink>
        </View>
      )}
    </Section>
  );
}
