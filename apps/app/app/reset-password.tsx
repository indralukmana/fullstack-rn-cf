import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
    <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Choose a new password
      </Text>
      {!token ? (
        <Text className="text-sm text-red-600">
          This reset link is missing a token. Request a new link from forgot password.
        </Text>
      ) : null}
      <TextInput
        autoComplete="new-password"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        value={password}
      />
      <TextInput
        autoComplete="new-password"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        onChangeText={setConfirm}
        placeholder="Confirm password"
        secureTextEntry
        value={confirm}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        className="rounded-lg bg-slate-900 px-5 py-3"
        disabled={pending || !token}
        onPress={onSubmit}
      >
        <Text className="text-center font-semibold text-white">
          {pending ? "Saving…" : "Update password"}
        </Text>
      </Pressable>
      <Link href="/forgot-password" className="text-center text-slate-600">
        Request a new link
      </Link>
    </View>
  );
}
