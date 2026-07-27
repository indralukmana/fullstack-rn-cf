import {
  useCreateFeatureItem,
  useListFeatureItems,
  getListFeatureItemsQueryKey,
} from "@rn-cf/api-client";
import { useState } from "react";
import { View } from "react-native";

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

const FEATURE_KEY = "notes";

export default function NotesScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganization = authClient.useActiveOrganization();
  const listQuery = useListFeatureItems(FEATURE_KEY, {
    query: {
      queryKey: getListFeatureItemsQueryKey(FEATURE_KEY),
      enabled: Boolean(session?.user && activeOrganization.data?.id),
    },
  });
  const createMutation = useCreateFeatureItem();
  const [titleValue, setTitleValue] = useState("");
  const [bodyValue, setBodyValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (sessionPending || activeOrganization.isPending) {
    return <LoadingScreen label="Loading…" />;
  }

  if (!session?.user) {
    return (
      <Screen centered>
        <ScreenTitle>Notes</ScreenTitle>
        <ScreenLead>Sign in to manage notes for your active organization.</ScreenLead>
        <QuietLink href="/sign-in">Sign in</QuietLink>
      </Screen>
    );
  }

  if (!activeOrganization.data) {
    return (
      <Screen centered>
        <ScreenTitle>Notes</ScreenTitle>
        <ScreenLead>Select an active organization first.</ScreenLead>
        <QuietLink href="/organizations">Organizations</QuietLink>
      </Screen>
    );
  }

  const items =
    listQuery.data?.data && "items" in listQuery.data.data ? listQuery.data.data.items : [];

  async function onCreate() {
    const titleText = titleValue.trim();
    if (!titleText) {
      setError("Title is required.");
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        featureKey: FEATURE_KEY,
        data: { title: titleText, body: bodyValue.trim() || undefined },
      });
      setTitleValue("");
      setBodyValue("");
      await listQuery.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create item.");
    }
  }

  return (
    <Screen scroll>
      <ScreenTitle>Notes</ScreenTitle>
      <ScreenLead>
        Org-scoped notes for {activeOrganization.data.name}. Backed by{" "}
        {`/api/features/${FEATURE_KEY}/items`}.
      </ScreenLead>

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
          <EmptyState
            title="No items yet"
            description="Create the first notes item for this organization."
          />
        )}
      </Section>

      <Section title="Create">
        <View className="gap-3">
          <Field
            label="Title"
            onChangeText={setTitleValue}
            value={titleValue}
            placeholder="Title"
          />
          <Field
            label="Body"
            onChangeText={setBodyValue}
            value={bodyValue}
            placeholder="Optional details"
          />
          <Button
            disabled={createMutation.isPending}
            label={createMutation.isPending ? "Saving…" : "Create"}
            onPress={() => void onCreate()}
          />
          {error ? <StatusText>{error}</StatusText> : null}
        </View>
      </Section>

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
