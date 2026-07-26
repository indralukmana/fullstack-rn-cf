import {
  getGetBillingStatusQueryKey,
  useCreateStripeCheckout,
  useCreateStripePortal,
  useGetBillingStatus,
  useRequestBillingReconciliation,
} from "@rn-cf/api-client";
import * as Linking from "expo-linking";
import { Link, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

import {
  Button,
  EmptyState,
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
import {
  configureNativeBilling,
  getNativePackages,
  presentNativeCustomerCenter,
  purchaseNativePackage,
  restoreNativePurchases,
  type NativePackage,
} from "@/lib/billing/revenuecat";

function message(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Subscription request failed";
}

export default function SubscriptionScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const statusQuery = useGetBillingStatus({
    query: {
      queryKey: getGetBillingStatusQueryKey(),
      enabled: Boolean(session?.user),
    },
  });
  const checkout = useCreateStripeCheckout();
  const portal = useCreateStripePortal();
  const reconcile = useRequestBillingReconciliation();
  const [nativePackages, setNativePackages] = useState<NativePackage[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !session?.user.id) {
      return undefined;
    }
    let active = true;
    void configureNativeBilling(session.user.id)
      .then(() => getNativePackages())
      .then((items) => {
        if (active) {
          setNativePackages(items);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(message(reason));
        }
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  if (sessionPending) {
    return <LoadingScreen label="Checking your account…" />;
  }
  if (!session?.user) {
    return <Redirect href="/sign-in?returnTo=/subscription" />;
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

  const statusData = statusQuery.data?.data;
  const status = statusData && "hasAccess" in statusData ? statusData : null;
  const activeGrant = status?.grants.find(
    (grant) => grant.status === "active" || grant.status === "grace_period",
  );

  async function refreshStatus() {
    await reconcile.mutateAsync();
    await statusQuery.refetch();
  }

  async function run(id: string, action: () => Promise<void>) {
    setPendingAction(id);
    setError(null);
    try {
      await action();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setPendingAction(null);
    }
  }

  async function startWebCheckout(interval: "monthly" | "yearly") {
    await statusQuery.refetch();
    const result = await checkout.mutateAsync({ data: { interval } });
    if (!("url" in result.data)) {
      throw new Error(result.data.message);
    }
    await Linking.openURL(result.data.url);
  }

  async function buyNative(item: NativePackage) {
    await statusQuery.refetch();
    await purchaseNativePackage(item.id);
    await refreshStatus();
  }

  async function manageSubscription() {
    if (activeGrant?.provider === "stripe") {
      const result = await portal.mutateAsync();
      if (!("url" in result.data)) {
        throw new Error(result.data.message);
      }
      await Linking.openURL(result.data.url);
      return;
    }
    if (Platform.OS !== "web" && activeGrant?.provider === "revenuecat") {
      await presentNativeCustomerCenter();
      await refreshStatus();
      return;
    }
    if (activeGrant?.managementUrl) {
      await Linking.openURL(activeGrant.managementUrl);
      return;
    }
    throw new Error("No subscription management link is available");
  }

  return (
    <Screen scroll>
      <ScreenTitle>Pro subscription</ScreenTitle>
      <ScreenLead>One account unlocks Pro on web, iOS, and Android.</ScreenLead>

      <Section title="Access">
        {statusQuery.isError ? (
          <QueryError
            message="Could not load subscription status."
            onRetry={() => void statusQuery.refetch()}
          />
        ) : (
          <>
            <Text className="text-lg font-semibold text-foreground">
              {statusQuery.isLoading
                ? "Checking…"
                : status?.hasAccess
                  ? `Pro · ${status.status.replace("_", " ")}`
                  : "Free"}
            </Text>
            {activeGrant ? (
              <Text className="text-sm text-foreground-secondary">
                Managed by {activeGrant.provider === "stripe" ? "Stripe" : "your app store"}
              </Text>
            ) : null}
          </>
        )}
      </Section>

      <View className="gap-3">
        {status?.hasAccess ? (
          <Button
            disabled={Boolean(pendingAction)}
            label="Manage subscription"
            onPress={() => run("manage", manageSubscription)}
          />
        ) : Platform.OS === "web" ? (
          (["monthly", "yearly"] as const).map((interval) => (
            <Button
              key={interval}
              disabled={Boolean(pendingAction)}
              label={`Choose ${interval}`}
              onPress={() => run(interval, () => startWebCheckout(interval))}
            />
          ))
        ) : nativePackages.length === 0 ? (
          <EmptyState
            description={
              error
                ? "Store offerings could not be loaded. Check your network or RevenueCat configuration, then refresh."
                : "No store packages are available yet. Refresh after the RevenueCat offering is configured."
            }
            title="No packages available"
          />
        ) : (
          <>
            {nativePackages.map((item) => (
              <Button
                key={item.id}
                disabled={Boolean(pendingAction)}
                label={`${item.interval} · ${item.price}`}
                onPress={() => run(item.id, () => buyNative(item))}
              />
            ))}
            <Button
              disabled={Boolean(pendingAction)}
              label="Restore purchases"
              onPress={() =>
                run("restore", async () => {
                  await restoreNativePurchases();
                  await refreshStatus();
                })
              }
              variant="secondary"
            />
          </>
        )}

        <Button
          disabled={Boolean(pendingAction)}
          label="Refresh subscription"
          onPress={() => run("refresh", refreshStatus)}
          variant="secondary"
        />
      </View>

      {pendingAction ? <StatusText tone="muted">Please wait…</StatusText> : null}
      {error ? <StatusText>{error}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
