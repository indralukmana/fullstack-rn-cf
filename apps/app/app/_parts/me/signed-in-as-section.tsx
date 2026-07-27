import { View } from "react-native";

import { BodyText, QueryError, Section } from "@/components/ui";

type SignedInAsSectionProps = {
  session: { user: { name: string; email: string } } | null;
  meQueryError: boolean;
  onRetryMe: () => void;
};

export function SignedInAsSection({ session, meQueryError, onRetryMe }: SignedInAsSectionProps) {
  return (
    <Section title="Signed in as">
      {session?.user && meQueryError ? (
        <QueryError message="Could not load account details." onRetry={onRetryMe} />
      ) : session?.user ? (
        <View className="gap-1">
          <BodyText className="text-lg text-foreground" weight="semibold">
            {session.user.name}
          </BodyText>
          <BodyText className="text-base text-foreground-secondary">{session.user.email}</BodyText>
        </View>
      ) : (
        <BodyText className="text-base text-foreground-secondary">Signed out</BodyText>
      )}
    </Section>
  );
}
