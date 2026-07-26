import { exportAccountData, useDeleteAccount } from "@rn-cf/api-client";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Share, Text, View } from "react-native";

import {
  Button,
  ConfirmDialog,
  Field,
  LoadingScreen,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  Section,
  StatusText,
} from "@/components/ui";
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (sessionPending) {
    return <LoadingScreen label="Checking your account…" />;
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

  function onRequestDelete() {
    if (confirmation !== "DELETE") {
      setMessage("Type DELETE exactly to confirm.");
      return;
    }
    setMessage(null);
    setConfirmDeleteOpen(true);
  }

  async function onDelete() {
    setPending(true);
    setMessage(null);
    try {
      const result = await deleteAccount.mutateAsync({ data: { confirmation: "DELETE" } });
      if (!("deleted" in result.data)) {
        throw new Error(result.data.message);
      }
      setConfirmDeleteOpen(false);
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
    <Screen scroll>
      <ScreenTitle>Account data</ScreenTitle>
      <ScreenLead>Export a portable copy of account, membership, and subscription data.</ScreenLead>

      <Button disabled={pending} label="Export my data" onPress={onExport} variant="secondary" />

      <Section title="Delete account">
        <Text className="text-sm leading-5 text-slate-600">
          Apple, Google, and Stripe subscriptions must be managed first. Deleting this account never
          cancels store billing.
        </Text>
        <QuietLink href="./subscription">Manage subscriptions</QuietLink>
        <View className="gap-3">
          <Field
            autoCapitalize="characters"
            label="Confirmation"
            onChangeText={setConfirmation}
            placeholder="Type DELETE"
            value={confirmation}
          />
          <Button
            disabled={pending || confirmation !== "DELETE"}
            label="Permanently delete account"
            onPress={onRequestDelete}
            variant="danger"
          />
        </View>
      </Section>

      {message ? <StatusText>{message}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>

      <ConfirmDialog
        confirmLabel="Delete account"
        destructive
        message="This permanently removes your account data. Store and Stripe subscriptions are not canceled by this action."
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void onDelete()}
        pending={pending}
        title="Delete account?"
        visible={confirmDeleteOpen}
      />
    </Screen>
  );
}
