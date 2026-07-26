import { getGetBillingStatusQueryKey, useGetBillingStatus, useGetMe } from "@rn-cf/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";

import {
  BodyText,
  Button,
  LoadingScreen,
  QueryError,
  QuietLink,
  Screen,
  ScreenTitle,
  Section,
  StatusText,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { clearNativeBillingIdentity } from "@/lib/billing/revenuecat";

export default function MeScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const meQuery = useGetMe();
  const billingQuery = useGetBillingStatus({
    query: {
      queryKey: getGetBillingStatusQueryKey(),
      enabled: Boolean(session?.user),
    },
  });
  const billingStatus =
    billingQuery.data?.data && "hasAccess" in billingQuery.data.data
      ? billingQuery.data.data
      : null;
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function onSignOut() {
    setSignOutError(null);
    const result = await authClient.signOut({
      fetchOptions: {
        credentials: Platform.OS === "web" ? "include" : "omit",
      },
    });
    if (result.error) {
      setSignOutError(result.error.message ?? "Sign out failed");
      return;
    }
    await clearNativeBillingIdentity();
  }

  if (sessionPending || (session?.user && meQuery.isLoading)) {
    return <LoadingScreen label="Loading account…" />;
  }

  return (
    <Screen scroll>
      <ScreenTitle>Account</ScreenTitle>

      <Section title="Signed in as">
        {session?.user && meQuery.isError ? (
          <QueryError
            message="Could not load account details."
            onRetry={() => void meQuery.refetch()}
          />
        ) : session?.user ? (
          <View className="gap-1">
            <BodyText className="text-lg text-foreground" weight="semibold">
              {session.user.name}
            </BodyText>
            <BodyText className="text-base text-foreground-secondary">
              {session.user.email}
            </BodyText>
          </View>
        ) : (
          <BodyText className="text-base text-foreground-secondary">Signed out</BodyText>
        )}
      </Section>

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

      {signOutError ? <StatusText>{signOutError}</StatusText> : null}

      <View className="gap-3">
        {session?.user ? (
          <>
            <Link href="./subscription" asChild>
              <Button label="Manage subscription" />
            </Link>
            <Link href="./organizations" asChild>
              <Button label="Organizations" variant="secondary" />
            </Link>
            <Link href="./account-data" asChild>
              <Button label="Account data" variant="secondary" />
            </Link>
            <Button label="Sign out" onPress={onSignOut} variant="secondary" />
          </>
        ) : (
          <Link href="/sign-in" asChild>
            <Button label="Sign in" />
          </Link>
        )}
        <QuietLink href="/">Home</QuietLink>
      </View>
    </Screen>
  );
}
