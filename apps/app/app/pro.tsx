import { useGetProPing } from "@rn-cf/api-client";

import { EntitlementGate } from "@/components/entitlement-gate";
import {
  BodyText,
  LoadingScreen,
  QueryError,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  Section,
  StatusText,
} from "@/components/ui";

/**
 * Example paid surface. Product features should copy EntitlementGate + a server route that uses
 * requireEntitlement(), not client-only checks.
 */
export default function ProExampleScreen() {
  return (
    <EntitlementGate>
      <ProExampleBody />
    </EntitlementGate>
  );
}

function ProExampleBody() {
  const ping = useGetProPing();

  if (ping.isPending) {
    return <LoadingScreen label="Loading paid capability…" />;
  }

  return (
    <Screen scroll>
      <ScreenTitle>Paid example</ScreenTitle>
      <ScreenLead>
        This screen is gated in the app and backed by GET /api/private/pro (requireEntitlement).
      </ScreenLead>

      <Section title="Server check">
        {ping.isError ? (
          <QueryError message="Paid API call failed." onRetry={() => void ping.refetch()} />
        ) : ping.data?.status === 200 ? (
          <StatusText tone="success">Entitlement accepted by the API.</StatusText>
        ) : (
          <BodyText className="text-base text-foreground-secondary">
            Unexpected response from the paid ping route.
          </BodyText>
        )}
      </Section>

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
