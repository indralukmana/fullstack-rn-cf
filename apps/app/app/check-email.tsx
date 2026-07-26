import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import {
  Button,
  QuietLinkText,
  Screen,
  ScreenLead,
  ScreenTitle,
  StatusText,
} from "@/components/ui";
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
    <Screen centered scroll>
      <ScreenTitle>Check your email</ScreenTitle>
      <ScreenLead>
        {purpose === "reset"
          ? "If an account exists for that address, we sent a password reset link."
          : "We sent a verification link. Open it to finish creating your account."}
      </ScreenLead>
      {email ? <Text className="text-base font-medium text-slate-900">{email}</Text> : null}
      {message ? <StatusText tone="success">{message}</StatusText> : null}
      {error ? <StatusText>{error}</StatusText> : null}
      {email ? (
        <Button
          disabled={pending}
          label={
            pending ? "Sending…" : purpose === "reset" ? "Resend reset link" : "Resend verification"
          }
          onPress={onResend}
        />
      ) : null}
      {showDevMailbox ? (
        <View className="gap-3 border-t border-amber-200 pt-5">
          <Text className="text-sm font-semibold text-amber-950">Local mailbox (dev only)</Text>
          <Text className="text-sm leading-5 text-amber-900">
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
            <Button
              label={`Open latest ${purpose === "reset" ? "reset" : "verification"} link`}
              onPress={() => {
                void Linking.openURL(latestLink);
              }}
              variant="secondary"
            />
          ) : null}
          {latestMessage ? (
            <Text className="text-xs text-amber-900">Latest subject: {latestMessage.subject}</Text>
          ) : null}
          {mailboxError ? <StatusText>{mailboxError}</StatusText> : null}
          <Pressable accessibilityRole="button" onPress={() => void refreshMailbox()}>
            <Text className="text-sm font-medium text-amber-950 underline">Refresh mailbox</Text>
          </Pressable>
        </View>
      ) : null}
      <Link href="/sign-in">
        <QuietLinkText>Back to sign in</QuietLinkText>
      </Link>
    </Screen>
  );
}
