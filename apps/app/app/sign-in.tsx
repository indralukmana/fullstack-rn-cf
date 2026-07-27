import { View } from "react-native";

import { Button, Field, PasswordField, QuietLink, Screen, ScreenTitle } from "@/components/ui";

import { useSignInScreen } from "./_parts/sign-in/use-sign-in-screen";

export default function SignInScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    emailError,
    setEmailError,
    passwordError,
    setPasswordError,
    pending,
    onSubmit,
  } = useSignInScreen();

  return (
    <Screen centered>
      <ScreenTitle>Sign in</ScreenTitle>
      <View className="gap-3">
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
          autoComplete="password"
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
      <Button disabled={pending} label={pending ? "Signing in…" : "Sign in"} onPress={onSubmit} />
      <View className="gap-3">
        <QuietLink href="/forgot-password">Forgot password?</QuietLink>
        <QuietLink href="/sign-up">Need an account? Register</QuietLink>
      </View>
    </Screen>
  );
}
