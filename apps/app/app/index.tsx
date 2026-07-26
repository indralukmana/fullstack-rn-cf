import { Link } from "expo-router";
import { View } from "react-native";

import { Button, QuietLinkText, Screen, ScreenLead, ScreenTitle } from "@/components/ui";

export default function HomeScreen() {
  return (
    <Screen centered>
      <View className="gap-3">
        <ScreenTitle>RN CF</ScreenTitle>
        <ScreenLead>
          A Cloudflare Workers API with a universal Expo app for web, iOS, and Android.
        </ScreenLead>
      </View>
      <View className="gap-3">
        <Link href="/sign-up" asChild>
          <Button label="Get started" />
        </Link>
        <Link href="/sign-in" asChild>
          <Button label="Sign in" variant="secondary" />
        </Link>
        <Link href="/me">
          <QuietLinkText>Account</QuietLinkText>
        </Link>
      </View>
    </Screen>
  );
}
