import { exportAccountData, useDeleteAccount } from "@rn-cf/api-client";
import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { Pressable, Share, Text, TextInput, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { clearNativeBillingIdentity } from "@/lib/billing/revenuecat";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "The account request failed";
}

export default function AccountDataScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const deleteAccount = useDeleteAccount();
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (sessionPending) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-700">Checking your account…</Text>
      </View>
    );
  }
  if (!session?.user) {
    return <Redirect href="/sign-in" />;
  }

  async function onExport() {
    setPending(true);
    setMessage(null);
    try {
      const result = await exportAccountData();
      if (!("account" in result.data)) {
        throw new Error(result.data.message);
      }
      await Share.share({
        title: "Account data export",
        message: JSON.stringify(result.data, null, 2),
      });
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (confirmation !== "DELETE") {
      setMessage("Type DELETE exactly to confirm.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const result = await deleteAccount.mutateAsync({ data: { confirmation: "DELETE" } });
      if (!("deleted" in result.data)) {
        throw new Error(result.data.message);
      }
      await clearNativeBillingIdentity();
      await authClient.signOut();
      router.replace("/");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <View className="flex-1 gap-5 bg-slate-50 px-6 py-8">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Account data
      </Text>
      <Text className="text-slate-600">
        Export a portable copy of account, membership, and subscription data.
      </Text>
      <Pressable
        accessibilityRole="button"
        className="rounded-lg border border-slate-300 bg-white px-5 py-3"
        disabled={pending}
        onPress={onExport}
      >
        <Text className="text-center font-semibold text-slate-900">Export my data</Text>
      </Pressable>

      <View className="mt-4 gap-3 rounded-xl border border-red-200 bg-white p-4">
        <Text className="text-lg font-bold text-red-700">Delete account</Text>
        <Text className="text-sm text-slate-600">
          Apple, Google, and Stripe subscriptions must be managed first. Deleting this account never
          cancels store billing.
        </Text>
        <Link href="./subscription" className="font-semibold text-slate-900">
          Manage subscriptions
        </Link>
        <TextInput
          autoCapitalize="characters"
          className="rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
          onChangeText={setConfirmation}
          placeholder="Type DELETE"
          value={confirmation}
        />
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-red-700 px-5 py-3"
          disabled={pending || confirmation !== "DELETE"}
          onPress={onDelete}
        >
          <Text className="text-center font-semibold text-white">Permanently delete account</Text>
        </Pressable>
      </View>

      {message ? (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
