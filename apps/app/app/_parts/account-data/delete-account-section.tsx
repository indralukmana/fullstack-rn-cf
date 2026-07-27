import { View } from "react-native";

import { BodyText, Button, Field, QuietLink, Section } from "@/components/ui";

type DeleteAccountSectionProps = {
  confirmation: string;
  setConfirmation: (value: string) => void;
  pending: boolean;
  onRequestDelete: () => void;
};

export function DeleteAccountSection({
  confirmation,
  setConfirmation,
  pending,
  onRequestDelete,
}: DeleteAccountSectionProps) {
  return (
    <Section title="Delete account">
      <BodyText className="text-sm leading-5 text-foreground-secondary">
        Close or transfer every organization you solely own, and manage Apple, Google, and Stripe
        subscriptions first. Deleting this account never cancels store billing.
      </BodyText>
      <QuietLink href="./organizations">Manage organizations</QuietLink>
      <QuietLink href="./subscription">Manage subscriptions</QuietLink>
      <View className="gap-3">
        <Field
          autoCapitalize="characters"
          label="Confirmation"
          onChangeText={setConfirmation}
          placeholder="Type DELETE"
          value={confirmation}
        />
        <Button
          disabled={pending || confirmation !== "DELETE"}
          label="Permanently delete account"
          onPress={onRequestDelete}
          variant="danger"
        />
      </View>
    </Section>
  );
}
