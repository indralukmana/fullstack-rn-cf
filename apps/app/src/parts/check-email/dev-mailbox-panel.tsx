import { Linking, Pressable, View } from "react-native";

import { BodyText, Button, StatusText } from "@/components/ui";
import type { DevMailboxMessage } from "@/lib/dev-mailbox";

type DevMailboxPanelProps = {
  purpose: "reset" | "verify";
  mailboxApiUrl: string | null;
  latestLink: string | null;
  latestMessage: DevMailboxMessage | null;
  mailboxError: string | null;
  onRefresh: () => void;
};

export function DevMailboxPanel({
  purpose,
  mailboxApiUrl,
  latestLink,
  latestMessage,
  mailboxError,
  onRefresh,
}: DevMailboxPanelProps) {
  return (
    <View className="gap-3 border-t border-warning-border pt-5">
      <BodyText className="text-sm text-warning-foreground" weight="semibold">
        Local mailbox (dev only)
      </BodyText>
      <BodyText className="text-sm leading-5 text-warning-foreground">
        Emails are logged by the API console provider. Open the mailbox JSON or the latest message
        link below.
      </BodyText>
      {mailboxApiUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(mailboxApiUrl);
          }}
        >
          <BodyText className="text-sm text-warning-foreground underline" weight="semibold">
            Open /api/dev/mailbox for this address
          </BodyText>
        </Pressable>
      ) : null}
      {latestLink ? (
        <Button
          label={`Open latest ${purpose === "reset" ? "reset" : "verification"} link`}
          onPress={() => {
            void Linking.openURL(latestLink);
          }}
          variant="secondary"
        />
      ) : null}
      {latestMessage ? (
        <BodyText className="text-xs text-warning-foreground">
          Latest subject: {latestMessage.subject}
        </BodyText>
      ) : null}
      {mailboxError ? <StatusText>{mailboxError}</StatusText> : null}
      <Pressable accessibilityRole="button" onPress={onRefresh}>
        <BodyText className="text-sm text-warning-foreground underline" weight="semibold">
          Refresh mailbox
        </BodyText>
      </Pressable>
    </View>
  );
}
