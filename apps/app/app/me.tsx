import { getGetBillingStatusQueryKey, useGetBillingStatus, useGetMe } from "@rn-cf/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { Platform, Text, View } from "react-native";

import {
  Button,
  LoadingScreen,
  QuietLinkText,
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
        {session?.user ? (
          <View className="gap-1">
            <Text className="text-lg font-semibold text-slate-900">{session.user.name}</Text>
            <Text className="text-base text-slate-600">{session.user.email}</Text>
          </View>
        ) : (
          <Text className="text-base text-slate-600">Signed out</Text>
        )}
      </Section>

      <Section title="Subscription">
        <Text className="text-lg font-semibold text-slate-900">
          {billingQuery.isLoading ? "Checking…" : billingStatus?.hasAccess ? "Pro" : "Free"}
        </Text>
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
        <Link href="/">
          <QuietLinkText>Home</QuietLinkText>
        </Link>
      </View>
    </Screen>
  );
}
