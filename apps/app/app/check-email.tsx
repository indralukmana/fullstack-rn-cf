import { useLocalSearchParams } from "expo-router";

import {
  BodyText,
  Button,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  StatusText,
} from "@/components/ui";

import { DevMailboxPanel } from "./_parts/check-email/dev-mailbox-panel";
import { useCheckEmailScreen } from "./_parts/check-email/use-check-email-screen";

export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const purpose = params.purpose === "reset" ? "reset" : "verify";
  const {
    message,
    error,
    pending,
    mailboxError,
    latestMessage,
    showDevMailbox,
    mailboxApiUrl,
    latestLink,
    refreshMailbox,
    onResend,
  } = useCheckEmailScreen(email, purpose);

  return (
    <Screen centered scroll>
      <ScreenTitle>Check your email</ScreenTitle>
      <ScreenLead>
        {purpose === "reset"
          ? "If an account exists for that address, we sent a password reset link."
          : "We sent a verification link. Open it to finish creating your account."}
      </ScreenLead>
      {email ? (
        <BodyText className="text-base text-foreground" weight="semibold">
          {email}
        </BodyText>
      ) : null}
      {message ? <StatusText tone="success">{message}</StatusText> : null}
      {error ? <StatusText>{error}</StatusText> : null}
      {email ? (
        <Button
          disabled={pending}
          label={
            pending ? "Sending…" : purpose === "reset" ? "Resend reset link" : "Resend verification"
          }
          onPress={onResend}
        />
      ) : null}
      {showDevMailbox ? (
        <DevMailboxPanel
          latestLink={latestLink}
          latestMessage={latestMessage}
          mailboxApiUrl={mailboxApiUrl}
          mailboxError={mailboxError}
          onRefresh={() => void refreshMailbox()}
          purpose={purpose}
        />
      ) : null}
      <QuietLink href="/sign-in">Back to sign in</QuietLink>
    </Screen>
  );
}
