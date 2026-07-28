import { LoadingScreen, QuietLink, Screen, ScreenLead, ScreenTitle } from "@/components/ui";
import { FeatureItemCreateSection } from "@/src/parts/feature-items/feature-item-create-section";
import { FeatureItemsListSection } from "@/src/parts/feature-items/feature-items-list-section";
import { useFeatureItemsScreen } from "@/src/parts/feature-items/use-feature-items-screen";

const FEATURE_KEY = "tasks";

export default function TasksScreen() {
  const state = useFeatureItemsScreen(FEATURE_KEY);
  const { session, sessionPending, activeOrganization } = state;

  if (sessionPending || activeOrganization.isPending) {
    return <LoadingScreen label="Loading…" />;
  }

  if (!session?.user) {
    return (
      <Screen centered>
        <ScreenTitle>Tasks</ScreenTitle>
        <ScreenLead>Sign in to manage tasks for your active organization.</ScreenLead>
        <QuietLink href="/sign-in">Sign in</QuietLink>
      </Screen>
    );
  }

  if (!activeOrganization.data) {
    return (
      <Screen centered>
        <ScreenTitle>Tasks</ScreenTitle>
        <ScreenLead>Select an active organization first.</ScreenLead>
        <QuietLink href="/organizations">Organizations</QuietLink>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenTitle>Tasks</ScreenTitle>
      <ScreenLead>
        Org-scoped tasks for {activeOrganization.data.name}. Backed by{" "}
        {`/api/features/${FEATURE_KEY}/items`}.
      </ScreenLead>

      <FeatureItemsListSection
        emptyDescription="Create the first tasks item for this organization."
        items={state.items}
        listQuery={state.listQuery}
      />
      <FeatureItemCreateSection {...state} />

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
