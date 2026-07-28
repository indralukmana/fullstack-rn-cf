import { configureApiClient } from "@rn-cf/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Platform, View } from "react-native";
import { useUniwind } from "uniwind";

import "../global.css";
import { DeepLinkHandler } from "@/components/deep-link-handler";
import { OfflineBanner } from "@/components/offline-banner";
import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { appFonts } from "@/lib/fonts";

const canvasLight = "#f8fafc";
const canvasDark = "#0f172a";
const foregroundLight = "#0f172a";
const foregroundDark = "#f8fafc";

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
  const [fontsLoaded] = useFonts(appFonts);
  const { theme } = useUniwind();
  const dark = theme === "dark";
  const canvas = dark ? canvasDark : canvasLight;
  const foreground = dark ? foregroundDark : foregroundLight;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* expo-status-bar uses `style` as light|dark|auto, not a RN style object */}
      {/* oxlint-disable-next-line react/style-prop-object */}
      <StatusBar style="auto" />
      <View className="flex-1 bg-canvas">
        <DeepLinkHandler />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: canvas },
            headerShadowVisible: false,
            headerTintColor: foreground,
            headerTitleStyle: { fontWeight: "600" },
            contentStyle: { backgroundColor: canvas },
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
          <Stack.Screen name="pro" options={withBodyTitle("Paid example")} />
          <Stack.Screen name="notes" options={withBodyTitle("Notes")} />
          <Stack.Screen name="tasks" options={withBodyTitle("Tasks")} />
          <Stack.Screen name="account-data" options={withBodyTitle("Account data")} />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}
