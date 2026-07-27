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
import { Platform, View } from "react-native";

import {
  BodyText,
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
  const activeOrganization = authClient.useActiveOrganization();
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

  const membershipRole = activeOrganization.data?.members?.find(
    (member) => member.userId === session?.user.id,
  )?.role;
  const canManageBilling = membershipRole === "owner" || membershipRole === "admin";

  useEffect(() => {
    if (Platform.OS === "web" || !session?.user.id || !canManageBilling) {
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
  }, [session?.user.id, canManageBilling]);

  if (sessionPending || activeOrganization.isPending) {
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
      <ScreenLead>
        {canManageBilling
          ? "Owners and admins manage billing for the active organization."
          : "Members can view access for the active organization. Only owners and admins manage billing."}
      </ScreenLead>

      <Section title="Access">
        {statusQuery.isError ? (
          <QueryError
            message="Could not load subscription status."
            onRetry={() => void statusQuery.refetch()}
          />
        ) : (
          <>
            <BodyText className="text-lg text-foreground" weight="semibold">
              {statusQuery.isLoading
                ? "Checking…"
                : status?.hasAccess
                  ? `Pro · ${status.status.replace("_", " ")}`
                  : "Free"}
            </BodyText>
            {activeOrganization.data ? (
              <BodyText className="text-sm text-foreground-secondary">
                Active organization: {activeOrganization.data.name}
              </BodyText>
            ) : null}
            {activeGrant ? (
              <BodyText className="text-sm text-foreground-secondary">
                Managed by {activeGrant.provider === "stripe" ? "Stripe" : "your app store"}
              </BodyText>
            ) : null}
          </>
        )}
      </Section>

      <View className="gap-3">
        {canManageBilling ? (
          <>
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
          </>
        ) : (
          <EmptyState
            description="Ask an organization owner or admin if you need billing changes. You can still refresh status below."
            title="Members cannot manage billing"
          />
        )}

        {!canManageBilling ? (
          <Button
            disabled={Boolean(pendingAction)}
            label="Refresh subscription"
            onPress={() => run("refresh", refreshStatus)}
            variant="secondary"
          />
        ) : null}
      </View>

      {pendingAction ? <StatusText tone="muted">Please wait…</StatusText> : null}
      {error ? <StatusText>{error}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
