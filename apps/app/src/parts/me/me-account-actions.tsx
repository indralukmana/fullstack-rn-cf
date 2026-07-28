import { Link } from "expo-router";
import { View } from "react-native";

import { Button, NavRow, QuietLink } from "@/components/ui";

type MeAccountActionsProps = {
  signedIn: boolean;
  canManageBilling: boolean;
  onSignOut: () => void;
};

export function MeAccountActions({ signedIn, canManageBilling, onSignOut }: MeAccountActionsProps) {
  return (
    <View className="gap-6">
      {signedIn ? (
        <>
          <Link href="./subscription" asChild>
            <Button
              label={canManageBilling ? "Manage subscription" : "View subscription"}
              testID="account-subscription"
            />
          </Link>
          <View>
            <NavRow href="./notes" label="Notes" testID="account-nav-notes" />
            <NavRow href="./tasks" label="Tasks" testID="account-nav-tasks" />
            <NavRow
              href="./organizations"
              label="Organizations"
              testID="account-nav-organizations"
            />
            <NavRow href="./account-data" label="Account data" testID="account-nav-account-data" />
            <NavRow href="./pro" label="Paid example" testID="account-nav-pro" />
          </View>
          <Button
            label="Sign out"
            onPress={onSignOut}
            testID="account-sign-out"
            variant="secondary"
          />
        </>
      ) : (
        <Link href="/sign-in" asChild>
          <Button label="Sign in" testID="account-sign-in" />
        </Link>
      )}
      <QuietLink href="/">Home</QuietLink>
    </View>
  );
}
