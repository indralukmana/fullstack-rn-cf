import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
    <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Get started
      </Text>
      <TextInput
        autoComplete="name"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        onChangeText={setName}
        placeholder="Name"
        value={name}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
      />
      <TextInput
        autoComplete="new-password"
        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        className="rounded-lg bg-slate-900 px-5 py-3"
        disabled={pending}
        onPress={onSubmit}
      >
        <Text className="text-center font-semibold text-white">
          {pending ? "Creating account…" : "Create account"}
        </Text>
      </Pressable>
      <Link href="/sign-in" className="text-center text-slate-600">
        Already have an account? Sign in
      </Link>
    </View>
  );
}
