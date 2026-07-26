import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, QuietLink, Screen, ScreenTitle } from "@/components/ui";
import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: appCallbackUrl("/me"),
    });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Registration failed");
      return;
    }

    router.replace({
      pathname: "/check-email",
      params: { email, purpose: "verify" },
    });
  }

  return (
    <Screen centered>
      <ScreenTitle>Get started</ScreenTitle>
      <View className="gap-3">
        <Field
          autoComplete="name"
          label="Name"
          onChangeText={setName}
          placeholder="Name"
          value={name}
        />
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="Email"
          value={email}
        />
        <Field
          autoComplete="new-password"
          error={error}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            if (error) {
              setError(null);
            }
          }}
          placeholder="Password"
          secureTextEntry
          value={password}
        />
      </View>
      <Button
        disabled={pending}
        label={pending ? "Creating account…" : "Create account"}
        onPress={onSubmit}
      />
      <QuietLink href="/sign-in">Already have an account? Sign in</QuietLink>
    </Screen>
  );
}
