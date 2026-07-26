import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { Button, PasswordField, QuietLink, Screen, ScreenTitle, StatusText } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { validatePassword, validatePasswordConfirmation } from "@/lib/validation";

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
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    if (!token) {
      setFormError("Missing or invalid reset token");
      return;
    }
    const nextPasswordError = validatePassword(password);
    const nextConfirmError = validatePasswordConfirmation(password, confirm);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setFormError(null);
    if (nextPasswordError || nextConfirmError) {
      return;
    }

    setPending(true);
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
        <PasswordField
          autoComplete="new-password"
          error={passwordError}
          label="New password"
          onChangeText={(value) => {
            setPassword(value);
            if (passwordError) {
              setPasswordError(null);
            }
          }}
          placeholder="New password"
          value={password}
        />
        <PasswordField
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
          value={confirm}
        />
      </View>
      {formError ? <StatusText>{formError}</StatusText> : null}
      <Button
        disabled={pending || !token}
        label={pending ? "Saving…" : "Update password"}
        onPress={onSubmit}
      />
      <QuietLink href="/forgot-password">Request a new link</QuietLink>
    </Screen>
  );
}
