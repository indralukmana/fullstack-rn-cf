import { Link } from "expo-router";
import { View } from "react-native";

import { Button, QuietLink } from "@/components/ui";

type MeAccountActionsProps = {
  signedIn: boolean;
  canManageBilling: boolean;
  onSignOut: () => void;
};

export function MeAccountActions({ signedIn, canManageBilling, onSignOut }: MeAccountActionsProps) {
  return (
    <View className="gap-3">
      {signedIn ? (
        <>
          <Link href="./subscription" asChild>
            <Button label={canManageBilling ? "Manage subscription" : "View subscription"} />
          </Link>
          <Link href="./pro" asChild>
            <Button label="Paid example" variant="secondary" />
          </Link>
          <Link href="./notes" asChild>
            <Button label="Notes" variant="secondary" />
          </Link>
          <Link href="./tasks" asChild>
            <Button label="Tasks" variant="secondary" />
          </Link>
          <Link href="./organizations" asChild>
            <Button label="Organizations" variant="secondary" />
          </Link>
          <Link href="./account-data" asChild>
            <Button label="Account data" variant="secondary" />
          </Link>
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
