import {
  getGetBillingStatusQueryKey,
  useCreateStripeCheckout,
  useCreateStripePortal,
  useGetBillingStatus,
  useRequestBillingReconciliation,
} from "@rn-cf/api-client";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import type { NativePackage } from "@/lib/billing/revenuecat";

import {
  buyNativePackage,
  manageSubscription,
  refreshSubscriptionStatus,
  startWebCheckout,
} from "./subscription-actions";
import { subscriptionErrorMessage } from "./subscription-utils";
import { useNativeBillingPackages } from "./use-native-billing-packages";

export function useSubscriptionScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganization = authClient.useActiveOrganization();
  const statusQuery = useGetBillingStatus({
    query: {
      queryKey: getGetBillingStatusQueryKey(),
      enabled: Boolean(session?.user && activeOrganization.data?.id),
    },
  });
  const checkout = useCreateStripeCheckout();
  const portal = useCreateStripePortal();
  const reconcile = useRequestBillingReconciliation();
  const [nativePackages, setNativePackages] = useState<NativePackage[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const membershipRole = activeOrganization.data?.members?.find(
    (member) => member.userId === session?.user.id,
  )?.role;
  const canManageBilling = membershipRole === "owner" || membershipRole === "admin";
  const organizationId = activeOrganization.data?.id;

  useNativeBillingPackages(organizationId, canManageBilling, setNativePackages, setError);

  const statusData = statusQuery.data?.data;
  const status = statusData && "hasAccess" in statusData ? statusData : null;
  const activeGrant = status?.grants.find(
    (grant) => grant.status === "active" || grant.status === "grace_period",
  );

  async function refreshStatus() {
    await refreshSubscriptionStatus({ canManageBilling, reconcile, statusQuery });
  }

  async function run(id: string, action: () => Promise<void>) {
    setPendingAction(id);
    setError(null);
    try {
      await action();
    } catch (reason) {
      setError(subscriptionErrorMessage(reason));
    } finally {
      setPendingAction(null);
    }
  }

  return {
    session,
    sessionPending,
    activeOrganization,
    statusQuery,
    status,
    activeGrant,
    canManageBilling,
    nativePackages,
    pendingAction,
    error,
    run,
    refreshStatus,
    startWebCheckout: (interval: "monthly" | "yearly") =>
      startWebCheckout({ interval, statusQuery, checkout }),
    buyNative: (item: NativePackage) => buyNativePackage({ item, statusQuery, refreshStatus }),
    manageSubscription: () => manageSubscription({ activeGrant, portal, refreshStatus }),
  };
}

export type SubscriptionScreenState = ReturnType<typeof useSubscriptionScreen>;
