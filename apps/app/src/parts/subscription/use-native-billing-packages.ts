import { useEffect } from "react";
import { Platform } from "react-native";

import {
  configureNativeBilling,
  getNativePackages,
  type NativePackage,
} from "@/lib/billing/revenuecat";

import { subscriptionErrorMessage } from "./subscription-utils";

export function useNativeBillingPackages(
  organizationId: string | undefined,
  canManageBilling: boolean,
  setNativePackages: (items: NativePackage[]) => void,
  setError: (message: string) => void,
) {
  useEffect(() => {
    if (Platform.OS === "web" || !organizationId || !canManageBilling) {
      return undefined;
    }
    let active = true;
    void configureNativeBilling(organizationId)
      .then(() => getNativePackages())
      .then((items) => {
        if (active) {
          setNativePackages(items);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(subscriptionErrorMessage(reason));
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId, canManageBilling, setNativePackages, setError]);
}
