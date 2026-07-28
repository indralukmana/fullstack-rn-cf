import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, QuietLink, Screen, ScreenLead, ScreenTitle } from "@/components/ui";
import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) {
      return;
    }

    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: appCallbackUrl("/reset-password"),
    });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Could not start password reset");
      return;
    }

    router.replace({
      pathname: "/check-email",
      params: { email: email.trim(), purpose: "reset" },
    });
  }

  return (
    <Screen centered>
      <View className="gap-2">
        <ScreenTitle>Forgot password</ScreenTitle>
        <ScreenLead>Enter your email. We will send a reset link if an account exists.</ScreenLead>
      </View>
      <Field
        autoCapitalize="none"
        autoComplete="email"
        error={error}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => {
          setEmail(value);
          if (error) {
            setError(null);
          }
        }}
        value={email}
      />
      <View className="gap-3">
        <Button
          disabled={pending}
          label={pending ? "Sending…" : "Send reset link"}
          onPress={onSubmit}
        />
        <QuietLink href="/sign-in">Back to sign in</QuietLink>
      </View>
    </Screen>
  );
}
