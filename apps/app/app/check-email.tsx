import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";

export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const purpose = params.purpose === "reset" ? "reset" : "verify";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      <Link href="/sign-in" className="text-center text-slate-600">
        Back to sign in
      </Link>
    </View>
  );
}
