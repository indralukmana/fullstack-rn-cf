import * as Linking from "expo-linking";
import { Platform } from "react-native";

import {
  presentNativeCustomerCenter,
  purchaseNativePackage,
  type NativePackage,
} from "@/lib/billing/revenuecat";

type BillingGrant = {
  provider: string;
  managementUrl?: string | null;
};

type StatusQuery = {
  refetch: () => Promise<unknown>;
};

export async function refreshSubscriptionStatus(input: {
  canManageBilling: boolean;
  reconcile: { mutateAsync: () => Promise<unknown> };
  statusQuery: StatusQuery;
}) {
  if (input.canManageBilling) {
    await input.reconcile.mutateAsync();
  }
  await input.statusQuery.refetch();
}

export async function startWebCheckout(input: {
  interval: "monthly" | "yearly";
  statusQuery: StatusQuery;
  checkout: {
    mutateAsync: (args: {
      data: { interval: "monthly" | "yearly" };
    }) => Promise<{ data: { url: string } | { message: string } }>;
  };
}) {
  await input.statusQuery.refetch();
  const result = await input.checkout.mutateAsync({ data: { interval: input.interval } });
  if (!("url" in result.data)) {
    throw new Error(result.data.message);
  }
  await Linking.openURL(result.data.url);
}

export async function buyNativePackage(input: {
  item: NativePackage;
  statusQuery: StatusQuery;
  refreshStatus: () => Promise<void>;
}) {
  await input.statusQuery.refetch();
  await purchaseNativePackage(input.item.id);
  await input.refreshStatus();
}

export async function manageSubscription(input: {
  activeGrant: BillingGrant | undefined;
  portal: {
    mutateAsync: () => Promise<{ data: { url: string } | { message: string } }>;
  };
  refreshStatus: () => Promise<void>;
}) {
  if (input.activeGrant?.provider === "stripe") {
    const result = await input.portal.mutateAsync();
    if (!("url" in result.data)) {
      throw new Error(result.data.message);
    }
    await Linking.openURL(result.data.url);
    return;
  }
  if (Platform.OS !== "web" && input.activeGrant?.provider === "revenuecat") {
    await presentNativeCustomerCenter();
    await input.refreshStatus();
    return;
  }
  if (input.activeGrant?.managementUrl) {
    await Linking.openURL(input.activeGrant.managementUrl);
    return;
  }
  throw new Error("No subscription management link is available");
}
