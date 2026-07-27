import { getGetBillingStatusQueryKey, useGetBillingStatus } from "@rn-cf/api-client";

import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";

export type EntitlementAccess = {
  isPending: boolean;
  isError: boolean;
  hasAccess: boolean;
  status: string | null;
  entitlementKey: string;
  refetch: () => void;
};

function canQueryBillingStatus(hasUser: boolean, organizationId: string | undefined): boolean {
  return hasUser && Boolean(organizationId);
}

/**
 * Client display of server Entitlement. Never grant capabilities from this alone —
 * paid API routes must still use requireEntitlement.
 */
export function useEntitlementAccess(
  entitlementKey = env.billingEntitlementKey,
): EntitlementAccess {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganization = authClient.useActiveOrganization();
  const canQueryBilling = canQueryBillingStatus(
    Boolean(session?.user),
    activeOrganization.data?.id,
  );

  const statusQuery = useGetBillingStatus({
    query: {
      queryKey: getGetBillingStatusQueryKey(),
      enabled: canQueryBilling,
    },
  });

  const statusData = statusQuery.data?.data;
  const status = statusData && "hasAccess" in statusData ? statusData : null;
  const keyMatches = !status || status.entitlement === entitlementKey;

  return {
    isPending:
      sessionPending || activeOrganization.isPending || (canQueryBilling && statusQuery.isPending),
    isError: canQueryBilling && statusQuery.isError,
    hasAccess: Boolean(status?.hasAccess && keyMatches),
    status: status?.status ?? null,
    entitlementKey,
    refetch: () => {
      void statusQuery.refetch();
    },
  };
}
