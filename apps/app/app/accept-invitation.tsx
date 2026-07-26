import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import {
  Button,
  LoadingScreen,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  StatusText,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const invitationId = typeof params.id === "string" ? params.id : "";
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    if (!invitationId) {
      setError("This invitation link is incomplete.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await authClient.organization.acceptInvitation({ invitationId });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Could not accept this invitation.");
      return;
    }

    router.replace("/me");
  }

  if (sessionPending) {
    return <LoadingScreen label="Checking your account…" />;
  }

  return (
    <Screen centered>
      <ScreenTitle>Organization invitation</ScreenTitle>

      {!invitationId ? (
        <StatusText>This invitation link is incomplete.</StatusText>
      ) : session?.user ? (
        <>
          <ScreenLead>Accept this invitation as {session.user.email}.</ScreenLead>
          {error ? <StatusText>{error}</StatusText> : null}
          <Button
            disabled={pending}
            label={pending ? "Accepting…" : "Accept invitation"}
            onPress={onAccept}
          />
        </>
      ) : (
        <>
          <ScreenLead>Sign in with the invited email address before accepting.</ScreenLead>
          <Link
            href={{
              pathname: "/sign-in",
              params: {
                returnTo: `/accept-invitation?id=${encodeURIComponent(invitationId)}`,
              },
            }}
            asChild
          >
            <Button label="Sign in to continue" />
          </Link>
        </>
      )}

      <QuietLink href="/">Back to home</QuietLink>
    </Screen>
  );
}
