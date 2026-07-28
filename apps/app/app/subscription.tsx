import { Link, Redirect } from "expo-router";

import {
  Button,
  LoadingScreen,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  StatusText,
} from "@/components/ui";
import { SubscriptionAccessSection } from "@/src/parts/subscription/subscription-access-section";
import { SubscriptionBillingActions } from "@/src/parts/subscription/subscription-billing-actions";
import { useSubscriptionScreen } from "@/src/parts/subscription/use-subscription-screen";

export default function SubscriptionScreen() {
  const state = useSubscriptionScreen();
  const { session, sessionPending, activeOrganization, canManageBilling, pendingAction, error } =
    state;

  if (sessionPending || activeOrganization.isPending) {
    return <LoadingScreen label="Checking your account…" />;
  }
  if (!session?.user) {
    return <Redirect href="/sign-in?returnTo=/subscription" />;
  }
  if (!activeOrganization.data) {
    return (
      <Screen centered>
        <ScreenTitle>Select an organization</ScreenTitle>
        <ScreenLead>Choose an active organization before managing Pro.</ScreenLead>
        <QuietLink href="/organizations">Organizations</QuietLink>
      </Screen>
    );
  }
  if (!session.user.emailVerified) {
    return (
      <Screen centered>
        <ScreenTitle>Verify your account</ScreenTitle>
        <ScreenLead>Verify {session.user.email} before choosing a subscription.</ScreenLead>
        <Link
          href={{
            pathname: "/check-email",
            params: { email: session.user.email, purpose: "verify" },
          }}
          asChild
        >
          <Button label="Continue verification" />
        </Link>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenTitle>Pro subscription</ScreenTitle>
      <ScreenLead>
        {canManageBilling
          ? "Owners and admins manage billing for the active organization."
          : "Members can view access for the active organization. Only owners and admins manage billing."}
      </ScreenLead>

      <SubscriptionAccessSection {...state} />
      <SubscriptionBillingActions {...state} />

      {pendingAction ? <StatusText tone="muted">Please wait…</StatusText> : null}
      {error ? <StatusText>{error}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
