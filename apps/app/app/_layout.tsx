import { configureApiClient } from "@rn-cf/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import "../global.css";
import { Platform, View } from "react-native";

import { OfflineBanner } from "@/components/offline-banner";
import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";

configureApiClient({
  baseUrl: env.apiUrl,
  credentials: Platform.OS === "web" ? "include" : "omit",
  getHeaders: (): Record<string, string> => {
    if (Platform.OS === "web") {
      return {};
    }
    const cookie = authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});

/** Keep the back control; page `ScreenTitle` owns the visible heading. */
function withBodyTitle(title: string) {
  return { title, headerTitle: "" };
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* expo-status-bar uses `style` as light|dark|auto, not a RN style object */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style="auto" />
      <View className="flex-1 bg-slate-50">
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#f8fafc" },
            headerShadowVisible: false,
            headerTintColor: "#0f172a",
            headerTitleStyle: { fontWeight: "600" },
            contentStyle: { backgroundColor: "#f8fafc" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "RN CF", headerShown: false }} />
          <Stack.Screen name="sign-in" options={withBodyTitle("Sign in")} />
          <Stack.Screen name="sign-up" options={withBodyTitle("Get started")} />
          <Stack.Screen name="check-email" options={withBodyTitle("Check your email")} />
          <Stack.Screen name="forgot-password" options={withBodyTitle("Forgot password")} />
          <Stack.Screen name="reset-password" options={withBodyTitle("Choose a new password")} />
          <Stack.Screen
            name="accept-invitation"
            options={withBodyTitle("Organization invitation")}
          />
          <Stack.Screen name="organizations" options={withBodyTitle("Organizations")} />
          <Stack.Screen name="me" options={withBodyTitle("Account")} />
          <Stack.Screen name="subscription" options={withBodyTitle("Pro subscription")} />
          <Stack.Screen name="account-data" options={withBodyTitle("Account data")} />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}
