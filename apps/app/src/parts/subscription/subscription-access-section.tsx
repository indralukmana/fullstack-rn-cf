import { BodyText, QueryError, Section } from "@/components/ui";

import type { SubscriptionScreenState } from "./use-subscription-screen";

type SubscriptionAccessSectionProps = Pick<
  SubscriptionScreenState,
  "statusQuery" | "status" | "activeGrant" | "activeOrganization"
>;

export function SubscriptionAccessSection({
  statusQuery,
  status,
  activeGrant,
  activeOrganization,
}: SubscriptionAccessSectionProps) {
  return (
    <Section title="Access">
      {statusQuery.isError ? (
        <QueryError
          message="Could not load subscription status."
          onRetry={() => void statusQuery.refetch()}
        />
      ) : (
        <>
          <BodyText className="text-lg text-foreground" weight="semibold">
            {statusQuery.isLoading
              ? "Checking…"
              : status?.hasAccess
                ? `Pro · ${status.status.replace("_", " ")}`
                : "Free"}
          </BodyText>
          {activeOrganization.data ? (
            <BodyText className="text-sm text-foreground-secondary">
              Active organization: {activeOrganization.data.name}
            </BodyText>
          ) : null}
          {activeGrant ? (
            <BodyText className="text-sm text-foreground-secondary">
              Managed by {activeGrant.provider === "stripe" ? "Stripe" : "your app store"}
            </BodyText>
          ) : null}
        </>
      )}
    </Section>
  );
}
