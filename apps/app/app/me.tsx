import { getGetBillingStatusQueryKey, useGetBillingStatus, useGetMe } from "@rn-cf/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Platform } from "react-native";

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

  return (
    <View className="flex-1 gap-4 bg-slate-50 px-6 py-8">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Account
      </Text>
      <View className="rounded-xl border border-slate-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold uppercase text-slate-500">Session</Text>
        {sessionPending ? (
          <Text className="text-slate-700">Loading session…</Text>
        ) : session?.user ? (
          <View className="gap-1">
            <Text className="text-slate-900">{session.user.name}</Text>
            <Text className="text-slate-600">{session.user.email}</Text>
          </View>
        ) : (
          <Text className="text-slate-700">Signed out</Text>
        )}
      </View>

      <View className="rounded-xl border border-slate-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold uppercase text-slate-500">/api/me</Text>
        <Text className="text-slate-700">
          {meQuery.isLoading
            ? "Loading…"
            : meQuery.data?.data.user
              ? `${meQuery.data.data.user.name} <${meQuery.data.data.user.email}>`
              : "No authenticated user"}
        </Text>
      </View>

      <View className="rounded-xl border border-slate-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold uppercase text-slate-500">Subscription</Text>
        <Text className="text-lg font-semibold text-slate-900">
          {billingQuery.isLoading ? "Checking…" : billingStatus?.hasAccess ? "Pro" : "Free"}
        </Text>
        <Link href="./subscription" className="mt-2 font-semibold text-slate-700">
          View subscription
        </Link>
      </View>

      {signOutError ? <Text className="text-sm text-red-600">{signOutError}</Text> : null}

      <View className="flex-row flex-wrap gap-3">
        {session?.user ? (
          <>
            <Link href="./subscription" asChild>
              <Pressable accessibilityRole="button" className="rounded-lg bg-slate-900 px-5 py-3">
                <Text className="font-semibold text-white">Subscription</Text>
              </Pressable>
            </Link>
            <Link href="./organizations" asChild>
              <Pressable
                accessibilityRole="button"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3"
              >
                <Text className="font-semibold text-slate-900">Organizations</Text>
              </Pressable>
            </Link>
            <Link href="./account-data" asChild>
              <Pressable
                accessibilityRole="button"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3"
              >
                <Text className="font-semibold text-slate-900">Account data</Text>
              </Pressable>
            </Link>
            <Pressable
              accessibilityRole="button"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3"
              onPress={onSignOut}
            >
              <Text className="font-semibold text-slate-900">Sign out</Text>
            </Pressable>
          </>
        ) : (
          <Link href="/sign-in" asChild>
            <Pressable accessibilityRole="button" className="rounded-lg bg-slate-900 px-5 py-3">
              <Text className="font-semibold text-white">Sign in</Text>
            </Pressable>
          </Link>
        )}
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="button"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3"
          >
            <Text className="font-semibold text-slate-900">Home</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
