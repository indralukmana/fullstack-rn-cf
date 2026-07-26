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
  const [formError, setFormError] = useState<string | null>(paramError);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    if (!token) {
      setFormError("Missing or invalid reset token");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords do not match");
      setFormError(null);
      return;
    }

    setPending(true);
    setFormError(null);
    setConfirmError(null);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);

    if (result.error) {
      setFormError(result.error.message ?? "Could not reset password");
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
          label="New password"
          onChangeText={setPassword}
          placeholder="New password"
          secureTextEntry
          value={password}
        />
        <Field
          autoComplete="new-password"
          error={confirmError}
          label="Confirm password"
          onChangeText={(value) => {
            setConfirm(value);
            if (confirmError) {
              setConfirmError(null);
            }
          }}
          placeholder="Confirm password"
          secureTextEntry
          value={confirm}
        />
      </View>
      {formError ? <StatusText>{formError}</StatusText> : null}
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
