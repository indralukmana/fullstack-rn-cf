import { View } from "react-native";

import { BodyText, EmptyState, QueryError, Section } from "@/components/ui";

import type { FeatureItemsScreenState } from "./use-feature-items-screen";

type FeatureItemsListSectionProps = Pick<FeatureItemsScreenState, "listQuery" | "items"> & {
  emptyDescription?: string;
};

export function FeatureItemsListSection({
  listQuery,
  items,
  emptyDescription = "Create the first item for this organization.",
}: FeatureItemsListSectionProps) {
  return (
    <Section title="Items">
      {listQuery.isError ? (
        <QueryError message="Could not load items." onRetry={() => void listQuery.refetch()} />
      ) : listQuery.isPending ? (
        <BodyText className="text-base text-foreground-secondary">Loading…</BodyText>
      ) : items.length ? (
        <View className="gap-2">
          {items.map((item) => (
            <View key={item.id} className="rounded-lg border border-border bg-elevated px-4 py-3">
              <BodyText className="text-foreground" weight="semibold">
                {item.title}
              </BodyText>
              {item.body ? (
                <BodyText className="text-sm text-foreground-muted">{item.body}</BodyText>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <EmptyState title="No items yet" description={emptyDescription} />
      )}
    </Section>
  );
}
