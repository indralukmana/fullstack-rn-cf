import { Link, Redirect } from "expo-router";
import type { ReactNode } from "react";

import { Button, LoadingScreen, QuietLink, Screen, ScreenLead, ScreenTitle } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { useEntitlementAccess } from "@/lib/entitlement";

/**
 * UI gate for paid screens. Server routes remain authoritative via requireEntitlement.
 */
export function EntitlementGate({
  children,
  entitlementKey,
  subscribeHref = "/subscription",
}: {
  children: ReactNode;
  entitlementKey?: string;
  subscribeHref?: "/subscription";
}) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const access = useEntitlementAccess(entitlementKey);

  if (sessionPending || access.isPending) {
    return <LoadingScreen label="Checking access…" />;
  }

  if (!session?.user) {
    return <Redirect href={`/sign-in?returnTo=${encodeURIComponent(subscribeHref)}`} />;
  }

  if (access.isError) {
    return (
      <Screen centered>
        <ScreenTitle>Could not verify access</ScreenTitle>
        <ScreenLead>We could not load subscription status for this account.</ScreenLead>
        <Button label="Try again" onPress={access.refetch} />
        <QuietLink href="/me">Back to account</QuietLink>
      </Screen>
    );
  }

  if (!access.hasAccess) {
    return (
      <Screen centered>
        <ScreenTitle>Subscription required</ScreenTitle>
        <ScreenLead>
          This area needs the {access.entitlementKey} entitlement on the active organization.
        </ScreenLead>
        <Link href={subscribeHref} asChild>
          <Button label="View subscription" />
        </Link>
        <QuietLink href="/me">Back to account</QuietLink>
      </Screen>
    );
  }

  return children;
}
