import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Field, PasswordField, QuietLink, Screen, ScreenTitle } from "@/components/ui";
import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    const nextNameError = validateName(name);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextNameError || nextEmailError || nextPasswordError) {
      return;
    }

    setPending(true);
    setPasswordError(null);
    const result = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      callbackURL: appCallbackUrl("/me"),
    });
    setPending(false);

    if (result.error) {
      setPasswordError(result.error.message ?? "Registration failed");
      return;
    }

    router.replace({
      pathname: "/check-email",
      params: { email: email.trim(), purpose: "verify" },
    });
  }

  return (
    <Screen centered>
      <ScreenTitle>Get started</ScreenTitle>
      <View className="gap-3">
        <Field
          autoComplete="name"
          error={nameError}
          label="Name"
          onChangeText={(value) => {
            setName(value);
            if (nameError) {
              setNameError(null);
            }
          }}
          placeholder="Name"
          value={name}
        />
        <Field
          autoCapitalize="none"
          autoComplete="email"
          error={emailError}
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => {
            setEmail(value);
            if (emailError) {
              setEmailError(null);
            }
          }}
          placeholder="Email"
          value={email}
        />
        <PasswordField
          autoComplete="new-password"
          error={passwordError}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) {
              setPasswordError(null);
            }
          }}
          placeholder="Password"
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
