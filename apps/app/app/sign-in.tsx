import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, QuietLinkText, Screen, ScreenTitle, StatusText } from "@/components/ui";
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
      if (returnUrl.origin === "https://app.local" && returnUrl.pathname === "/subscription") {
        router.replace("./subscription");
        return;
      }
    }

    router.replace("/me");
  }

  return (
    <Screen centered>
      <ScreenTitle>Sign in</ScreenTitle>
      <View className="gap-3">
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          value={email}
        />
        <Field
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          value={password}
        />
      </View>
      {error ? <StatusText>{error}</StatusText> : null}
      <Button disabled={pending} label={pending ? "Signing in…" : "Sign in"} onPress={onSubmit} />
      <View className="gap-3">
        <Link href="/forgot-password">
          <QuietLinkText>Forgot password?</QuietLinkText>
        </Link>
        <Link href="/sign-up">
          <QuietLinkText>Need an account? Register</QuietLinkText>
        </Link>
      </View>
    </Screen>
  );
}
