import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  BodyText,
  LoadingScreen,
  QueryError,
  Screen,
  ScreenTitle,
  Section,
  StatusText,
} from "@/components/ui";
import { ActiveOrganizationSection } from "@/src/parts/me/active-organization-section";
import { MeAccountActions } from "@/src/parts/me/me-account-actions";
import { SignedInAsSection } from "@/src/parts/me/signed-in-as-section";
import { useMeScreen } from "@/src/parts/me/use-me-screen";

export default function MeScreen() {
  const {
    session,
    sessionPending,
    meQuery,
    activeOrganization,
    billingQuery,
    billingStatus,
    signOutError,
    membershipRole,
    canManageBilling,
    onSignOut,
  } = useMeScreen();

  if (sessionPending || (session?.user && meQuery.isLoading)) {
    return <LoadingScreen label="Loading account…" />;
  }

  return (
    <Screen scroll>
      <ScreenTitle>Account</ScreenTitle>

      <SignedInAsSection
        meQueryError={meQuery.isError}
        onRetryMe={() => void meQuery.refetch()}
        session={session}
      />

      {session?.user ? (
        <ActiveOrganizationSection
          activeOrganization={activeOrganization}
          membershipRole={membershipRole}
        />
      ) : null}

      <Section title="Subscription">
        {session?.user && billingQuery.isError ? (
          <QueryError
            message="Could not load subscription status."
            onRetry={() => void billingQuery.refetch()}
          />
        ) : (
          <BodyText className="text-lg text-foreground" weight="semibold">
            {billingQuery.isLoading ? "Checking…" : billingStatus?.hasAccess ? "Pro" : "Free"}
          </BodyText>
        )}
      </Section>

      <Section title="Appearance">
        <BodyText className="text-sm text-foreground-secondary">
          Choose system, light, or dark. The canvas and controls follow Uniwind theme tokens.
        </BodyText>
        <ThemeSwitcher />
      </Section>

      {signOutError ? <StatusText>{signOutError}</StatusText> : null}

      <MeAccountActions
        canManageBilling={canManageBilling}
        onSignOut={onSignOut}
        signedIn={Boolean(session?.user)}
      />
    </Screen>
  );
}
