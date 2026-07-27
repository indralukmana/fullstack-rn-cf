import { Pressable, View } from "react-native";

import { BodyText, EmptyState, Section } from "@/components/ui";

import type { OrganizationsScreenState } from "./use-organizations-screen";

type OrganizationListSectionProps = Pick<
  OrganizationsScreenState,
  "organizations" | "activeOrganization" | "pending" | "onSelect"
>;

export function OrganizationListSection({
  organizations,
  activeOrganization,
  pending,
  onSelect,
}: OrganizationListSectionProps) {
  return (
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
  );
}
