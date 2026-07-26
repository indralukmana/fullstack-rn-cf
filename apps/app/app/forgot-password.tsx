import { router } from "expo-router";
import { useState } from "react";

import { Button, Field, QuietLink, Screen, ScreenLead, ScreenTitle } from "@/components/ui";
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
    <Screen centered>
      <ScreenTitle>Forgot password</ScreenTitle>
      <ScreenLead>Enter your email and we will send a reset link if an account exists.</ScreenLead>
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
        placeholder="Email"
        value={email}
      />
      <Button
        disabled={pending}
        label={pending ? "Sending…" : "Send reset link"}
        onPress={onSubmit}
      />
      <QuietLink href="/sign-in">Back to sign in</QuietLink>
    </Screen>
  );
}
