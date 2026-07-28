import { Link } from "expo-router";

import {
  Button,
  LoadingScreen,
  QueryError,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  StatusText,
} from "@/components/ui";
import { CreateOrganizationSection } from "@/src/parts/organizations/create-organization-section";
import { InviteMemberSection } from "@/src/parts/organizations/invite-member-section";
import { MembersSection } from "@/src/parts/organizations/members-section";
import { MembershipActionsSection } from "@/src/parts/organizations/membership-actions-section";
import { OrganizationConfirmDialogs } from "@/src/parts/organizations/organization-confirm-dialogs";
import { OrganizationListSection } from "@/src/parts/organizations/organization-list-section";
import { useOrganizationsScreen } from "@/src/parts/organizations/use-organizations-screen";

export default function OrganizationsScreen() {
  const state = useOrganizationsScreen();
  const { session, sessionPending, organizations, activeOrganization, error, pending } = state;

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

      <OrganizationListSection
        activeOrganization={activeOrganization}
        onSelect={state.onSelect}
        organizations={organizations}
        pending={pending}
      />
      <MembersSection {...state} />
      <MembershipActionsSection {...state} />
      <InviteMemberSection {...state} />
      <CreateOrganizationSection {...state} />

      {error ? <StatusText>{error}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>

      <OrganizationConfirmDialogs {...state} />
    </Screen>
  );
}
