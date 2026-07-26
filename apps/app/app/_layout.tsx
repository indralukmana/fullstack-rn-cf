import { configureApiClient } from "@rn-cf/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import "../global.css";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";

configureApiClient({
  baseUrl: env.apiUrl,
  credentials: Platform.OS === "web" ? "include" : "omit",
  getHeaders: () => {
    if (Platform.OS === "web") {
      return {} as Record<string, string>;
    }
    const cookie = authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* expo-status-bar uses `style` as light|dark|auto, not a RN style object */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          contentStyle: { backgroundColor: "#f8fafc" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "RN CF" }} />
        <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
        <Stack.Screen name="sign-up" options={{ title: "Register" }} />
        <Stack.Screen name="check-email" options={{ title: "Check email" }} />
        <Stack.Screen name="forgot-password" options={{ title: "Forgot password" }} />
        <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
        <Stack.Screen name="accept-invitation" options={{ title: "Organization invitation" }} />
        <Stack.Screen name="organizations" options={{ title: "Organizations" }} />
        <Stack.Screen name="me" options={{ title: "Account" }} />
        <Stack.Screen name="subscription" options={{ title: "Pro subscription" }} />
      </Stack>
    </QueryClientProvider>
  );
}
