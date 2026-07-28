import { Link } from "expo-router";
import { View } from "react-native";

import { BodyText, Button, Screen, ScreenLead, ScreenTitle } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export default function HomeScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganization = authClient.useActiveOrganization();
  const signedIn = Boolean(session?.user);

  return (
    <Screen centered>
      <View className="gap-2">
        <ScreenTitle>RN CF</ScreenTitle>
        <ScreenLead>Workers API and Expo app for web, iOS, and Android.</ScreenLead>
        {signedIn && !sessionPending ? (
          <BodyText className="text-sm text-foreground-secondary">
            Organization:{" "}
            {activeOrganization.isPending
              ? "Loading…"
              : (activeOrganization.data?.name ?? "None selected")}
          </BodyText>
        ) : null}
      </View>
      <View className="gap-3">
        {signedIn ? (
          <>
            <Link href="/me" asChild>
              <Button label="Account" testID="home-account" />
            </Link>
            <Link href="/organizations" asChild>
              <Button label="Organizations" testID="home-organizations" variant="secondary" />
            </Link>
          </>
        ) : (
          <>
            <Link href="/sign-up" asChild>
              <Button label="Get started" testID="home-get-started" />
            </Link>
            <Link href="/sign-in" asChild>
              <Button label="Sign in" testID="home-sign-in" variant="secondary" />
            </Link>
          </>
        )}
      </View>
    </Screen>
  );
}
