import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";

export default function SignInScreen() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: appCallbackUrl("/me"),
    });
    setPending(false);

    if (result.error) {
      const message = result.error.message ?? "Sign in failed";
      if (/verif/i.test(message) || result.error.code === "EMAIL_NOT_VERIFIED") {
        router.replace({
          pathname: "/check-email",
          params: { email, purpose: "verify" },
        });
        return;
      }
      setError(message);
      return;
    }

    if (typeof params.returnTo === "string") {
      const returnUrl = new URL(params.returnTo, "https://app.local");
      const invitationId = returnUrl.searchParams.get("id");
      if (
        returnUrl.origin === "https://app.local" &&
        returnUrl.pathname === "/accept-invitation" &&
        invitationId
      ) {
        router.replace({
          pathname: "/accept-invitation",
          params: { id: invitationId },
        });
        return;
      }
    }

    router.replace("/me");
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Sign in
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
      <TextInput
        autoComplete="password"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        className="rounded-lg bg-slate-900 px-5 py-3"
        disabled={pending}
        onPress={onSubmit}
      >
        <Text className="text-center font-semibold text-white">
          {pending ? "Signing in…" : "Sign in"}
        </Text>
      </Pressable>
      <Link href="/forgot-password" className="text-center text-slate-600">
        Forgot password?
      </Link>
      <Link href="/sign-up" className="text-center text-slate-600">
        Need an account? Register
      </Link>
    </View>
  );
}
