import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: appCallbackUrl("/reset-password"),
    });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Could not start password reset");
      return;
    }

    router.replace({
      pathname: "/check-email",
      params: { email, purpose: "reset" },
    });
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Forgot password
      </Text>
      <Text className="text-base text-slate-700">
        Enter your email and we will send a reset link if an account exists.
      </Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        className="rounded-lg bg-slate-900 px-5 py-3"
        disabled={pending}
        onPress={onSubmit}
      >
        <Text className="text-center font-semibold text-white">
          {pending ? "Sending…" : "Send reset link"}
        </Text>
      </Pressable>
      <Link href="/sign-in" className="text-center text-slate-600">
        Back to sign in
      </Link>
    </View>
  );
}
