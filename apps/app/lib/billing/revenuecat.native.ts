import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

import { env } from "@/lib/env";

export type NativePackage = {
  id: string;
  interval: "monthly" | "yearly";
  price: string;
};

const packages = new Map<string, PurchasesPackage>();
let configuredUserId: string | null = null;

export async function configureNativeBilling(userId: string): Promise<void> {
  const apiKey = Platform.OS === "ios" ? env.revenueCatIosApiKey : env.revenueCatAndroidApiKey;
  if (!configuredUserId) {
    Purchases.configure({ apiKey, appUserID: userId });
    configuredUserId = userId;
    return;
  }
  if (configuredUserId !== userId) {
    await Purchases.logIn(userId);
    configuredUserId = userId;
  }
}

export async function clearNativeBillingIdentity(): Promise<void> {
  if (configuredUserId) {
    await Purchases.logOut();
    configuredUserId = null;
    packages.clear();
  }
}

export async function getNativePackages(): Promise<NativePackage[]> {
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[env.revenueCatOfferingId] ?? offerings.current;
  if (!offering) {
    throw new Error("The subscription offering is unavailable");
  }

  packages.clear();
  const result: NativePackage[] = [];
  for (const item of offering.availablePackages) {
    const interval =
      item.packageType === Purchases.PACKAGE_TYPE.MONTHLY
        ? ("monthly" as const)
        : item.packageType === Purchases.PACKAGE_TYPE.ANNUAL
          ? ("yearly" as const)
          : null;
    if (interval) {
      packages.set(item.identifier, item);
      result.push({
        id: item.identifier,
        interval,
        price: item.product.priceString,
      });
    }
  }
  return result;
}

export async function purchaseNativePackage(packageId: string): Promise<void> {
  const item = packages.get(packageId);
  if (!item) {
    throw new Error("The selected subscription package is unavailable");
  }
  await Purchases.purchasePackage(item);
}

export async function restoreNativePurchases(): Promise<void> {
  await Purchases.restorePurchases();
}

export async function presentNativeCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter();
}
