import { getGetBillingStatusQueryKey, useGetBillingStatus, useGetMe } from "@rn-cf/api-client";
import { useState } from "react";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";
import { clearNativeBillingIdentity } from "@/lib/billing/revenuecat";

export function useMeScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const meQuery = useGetMe();
  const activeOrganization = authClient.useActiveOrganization();
  const billingQuery = useGetBillingStatus({
    query: {
      queryKey: getGetBillingStatusQueryKey(),
      enabled: Boolean(session?.user && activeOrganization.data?.id),
    },
  });
  const billingStatus =
    billingQuery.data?.data && "hasAccess" in billingQuery.data.data
      ? billingQuery.data.data
      : null;
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const membershipRole = activeOrganization.data?.members?.find(
    (member) => member.userId === session?.user.id,
  )?.role;
  const canManageBilling = membershipRole === "owner" || membershipRole === "admin";

  async function onSignOut() {
    setSignOutError(null);
    const result = await authClient.signOut({
      fetchOptions: {
        credentials: Platform.OS === "web" ? "include" : "omit",
      },
    });
    if (result.error) {
      setSignOutError(result.error.message ?? "Sign out failed");
      return;
    }
    await clearNativeBillingIdentity();
  }

  return {
    session,
    sessionPending,
    meQuery,
    activeOrganization,
    billingQuery,
    billingStatus,
    signOutError,
    membershipRole,
    canManageBilling,
    onSignOut,
  };
}
