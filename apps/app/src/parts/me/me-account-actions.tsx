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
            <Button label={canManageBilling ? "Manage subscription" : "View subscription"} />
          </Link>
          <View>
            <NavRow href="./notes" label="Notes" />
            <NavRow href="./tasks" label="Tasks" />
            <NavRow href="./organizations" label="Organizations" />
            <NavRow href="./account-data" label="Account data" />
            <NavRow href="./pro" label="Paid example" />
          </View>
          <Button label="Sign out" onPress={onSignOut} variant="secondary" />
        </>
      ) : (
        <Link href="/sign-in" asChild>
          <Button label="Sign in" />
        </Link>
      )}
      <QuietLink href="/">Home</QuietLink>
    </View>
  );
}
