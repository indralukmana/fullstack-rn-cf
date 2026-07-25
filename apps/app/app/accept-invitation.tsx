import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-slate-700">Checking your account…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900">
        Organization invitation
      </Text>

      {!invitationId ? (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          This invitation link is incomplete.
        </Text>
      ) : session?.user ? (
        <>
          <Text className="text-base text-slate-700">
            Accept this invitation as {session.user.email}.
          </Text>
          {error ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            className="rounded-lg bg-slate-900 px-5 py-3"
            disabled={pending}
            onPress={onAccept}
          >
            <Text className="text-center font-semibold text-white">
              {pending ? "Accepting…" : "Accept invitation"}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text className="text-base text-slate-700">
            Sign in with the invited email address before accepting.
          </Text>
          <Link
            href={{
              pathname: "/sign-in",
              params: {
                returnTo: `/accept-invitation?id=${encodeURIComponent(invitationId)}`,
              },
            }}
            asChild
          >
            <Pressable accessibilityRole="button" className="rounded-lg bg-slate-900 px-5 py-3">
              <Text className="text-center font-semibold text-white">Sign in to continue</Text>
            </Pressable>
          </Link>
        </>
      )}

      <Link href="/" className="text-center text-slate-600">
        Back to home
      </Link>
    </View>
  );
}
