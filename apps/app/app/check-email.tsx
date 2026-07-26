import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import {
  type DevMailboxMessage,
  extractEmailLink,
  fetchDevMailbox,
  isDevMailboxUiEnabled,
  devMailboxUrl,
} from "@/lib/dev-mailbox";

export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const purpose = params.purpose === "reset" ? "reset" : "verify";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mailboxError, setMailboxError] = useState<string | null>(null);
  const [latestMessage, setLatestMessage] = useState<DevMailboxMessage | null>(null);
  const showDevMailbox = isDevMailboxUiEnabled() && Boolean(email);
  const mailboxApiUrl = email ? devMailboxUrl(email) : null;
  const latestLink = latestMessage ? extractEmailLink(latestMessage.text) : null;

  const refreshMailbox = useCallback(async () => {
    if (!showDevMailbox || !email) {
      return;
    }
    try {
      const messages = await fetchDevMailbox(email);
      setLatestMessage(messages[0] ?? null);
      setMailboxError(null);
    } catch (refreshError) {
      setLatestMessage(null);
      setMailboxError(
        refreshError instanceof Error ? refreshError.message : "Could not load local mailbox",
      );
    }
  }, [email, showDevMailbox]);

  useEffect(() => {
    void refreshMailbox();
  }, [refreshMailbox]);

  async function onResend() {
    if (!email) {
      setError("Missing email address");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    if (purpose === "reset") {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: appCallbackUrl("/reset-password"),
      });
      setPending(false);
      if (result.error) {
        setError(result.error.message ?? "Could not resend reset email");
        return;
      }
      setMessage("If an account exists for that email, another reset link was sent.");
      await refreshMailbox();
      return;
    }

    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: appCallbackUrl("/me"),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not resend verification email");
      return;
    }
    setMessage("Verification email sent again.");
    await refreshMailbox();
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Check your email
      </Text>
      <Text className="text-base text-slate-700">
        {purpose === "reset"
          ? "If an account exists for that address, we sent a password reset link."
          : "We sent a verification link. Open it to finish creating your account."}
      </Text>
      {email ? <Text className="text-sm font-medium text-slate-900">{email}</Text> : null}
      {message ? <Text className="text-sm text-emerald-700">{message}</Text> : null}
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      {email ? (
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-slate-900 px-5 py-3"
          disabled={pending}
          onPress={onResend}
        >
          <Text className="text-center font-semibold text-white">
            {pending
              ? "Sending…"
              : purpose === "reset"
                ? "Resend reset link"
                : "Resend verification"}
          </Text>
        </Pressable>
      ) : null}
      {showDevMailbox ? (
        <View className="gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Text className="text-sm font-semibold text-amber-950">Local mailbox (dev only)</Text>
          <Text className="text-sm text-amber-900">
            Emails are logged by the API console provider. Open the mailbox JSON or the latest
            message link below.
          </Text>
          {mailboxApiUrl ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                void Linking.openURL(mailboxApiUrl);
              }}
            >
              <Text className="text-sm font-medium text-amber-950 underline">
                Open /api/dev/mailbox for this address
              </Text>
            </Pressable>
          ) : null}
          {latestLink ? (
            <Pressable
              accessibilityRole="button"
              className="rounded-lg bg-amber-900 px-4 py-3"
              onPress={() => {
                void Linking.openURL(latestLink);
              }}
            >
              <Text className="text-center font-semibold text-amber-50">
                Open latest {purpose === "reset" ? "reset" : "verification"} link
              </Text>
            </Pressable>
          ) : null}
          {latestMessage ? (
            <Text className="text-xs text-amber-900">Latest subject: {latestMessage.subject}</Text>
          ) : null}
          {mailboxError ? <Text className="text-sm text-red-700">{mailboxError}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => void refreshMailbox()}>
            <Text className="text-sm font-medium text-amber-950 underline">Refresh mailbox</Text>
          </Pressable>
        </View>
      ) : null}
      <Link href="/sign-in" className="text-center text-slate-600">
        Back to sign in
      </Link>
    </View>
  );
}
