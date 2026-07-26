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
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

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
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-700">Checking your account…</Text>
      </View>
    );
  }
  if (!session?.user) {
    return <Redirect href="/sign-in?returnTo=/subscription" />;
  }
  if (!session.user.emailVerified) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-slate-50 px-6">
        <Text accessibilityRole="header" className="text-xl font-bold text-slate-900">
          Verify your account
        </Text>
        <Text className="text-center text-slate-600">
          Verify {session.user.email} before choosing a subscription.
        </Text>
        <Link
          href={{
            pathname: "/check-email",
            params: { email: session.user.email, purpose: "verify" },
          }}
          className="font-semibold text-slate-900"
        >
          Continue verification
        </Link>
      </View>
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
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="gap-4 px-6 py-8">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Pro subscription
      </Text>
      <Text className="text-slate-600">One account unlocks Pro on web, iOS, and Android.</Text>

      <View className="rounded-xl border border-slate-200 bg-white p-4">
        <Text className="text-sm font-semibold uppercase text-slate-500">Access</Text>
        <Text className="mt-2 text-lg font-semibold text-slate-900">
          {statusQuery.isLoading
            ? "Checking…"
            : status?.hasAccess
              ? `Pro · ${status.status.replace("_", " ")}`
              : "Free"}
        </Text>
        {activeGrant ? (
          <Text className="mt-1 text-sm text-slate-600">
            Managed by {activeGrant.provider === "stripe" ? "Stripe" : "your app store"}
          </Text>
        ) : null}
      </View>

      {status?.hasAccess ? (
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-slate-900 px-5 py-3"
          disabled={Boolean(pendingAction)}
          onPress={() => run("manage", manageSubscription)}
        >
          <Text className="text-center font-semibold text-white">Manage subscription</Text>
        </Pressable>
      ) : Platform.OS === "web" ? (
        <View className="gap-3">
          {(["monthly", "yearly"] as const).map((interval) => (
            <Pressable
              key={interval}
              accessibilityRole="button"
              className="rounded-lg bg-slate-900 px-5 py-3"
              disabled={Boolean(pendingAction)}
              onPress={() => run(interval, () => startWebCheckout(interval))}
            >
              <Text className="text-center font-semibold capitalize text-white">
                Choose {interval}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="gap-3">
          {nativePackages.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              className="rounded-lg bg-slate-900 px-5 py-3"
              disabled={Boolean(pendingAction)}
              onPress={() => run(item.id, () => buyNative(item))}
            >
              <Text className="text-center font-semibold capitalize text-white">
                {item.interval} · {item.price}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3"
            disabled={Boolean(pendingAction)}
            onPress={() =>
              run("restore", async () => {
                await restoreNativePurchases();
                await refreshStatus();
              })
            }
          >
            <Text className="text-center font-semibold text-slate-900">Restore purchases</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        className="rounded-lg border border-slate-300 bg-white px-5 py-3"
        disabled={Boolean(pendingAction)}
        onPress={() => run("refresh", refreshStatus)}
      >
        <Text className="text-center font-semibold text-slate-900">Refresh subscription</Text>
      </Pressable>

      {pendingAction ? <Text className="text-center text-slate-600">Please wait…</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}
