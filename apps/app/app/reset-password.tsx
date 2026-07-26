import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { Button, Field, QuietLinkText, Screen, ScreenTitle, StatusText } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const token = useMemo(() => {
    if (typeof params.token === "string" && params.token.length > 0) {
      return params.token;
    }
    return null;
  }, [params.token]);
  const paramError = typeof params.error === "string" ? params.error : null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(paramError);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    if (!token) {
      setError("Missing or invalid reset token");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Could not reset password");
      return;
    }

    router.replace("/sign-in");
  }

  return (
    <Screen centered>
      <ScreenTitle>Choose a new password</ScreenTitle>
      {!token ? (
        <StatusText>
          This reset link is missing a token. Request a new link from forgot password.
        </StatusText>
      ) : null}
      <View className="gap-3">
        <Field
          autoComplete="new-password"
          onChangeText={setPassword}
          placeholder="New password"
          secureTextEntry
          value={password}
        />
        <Field
          autoComplete="new-password"
          onChangeText={setConfirm}
          placeholder="Confirm password"
          secureTextEntry
          value={confirm}
        />
      </View>
      {error ? <StatusText>{error}</StatusText> : null}
      <Button
        disabled={pending || !token}
        label={pending ? "Saving…" : "Update password"}
        onPress={onSubmit}
      />
      <Link href="/forgot-password">
        <QuietLinkText>Request a new link</QuietLinkText>
      </Link>
    </Screen>
  );
}
