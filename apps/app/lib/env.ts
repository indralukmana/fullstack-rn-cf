import { ENV } from "varlock/env";

export const env = {
  apiUrl: ENV.EXPO_PUBLIC_API_URL,
  appUrl: ENV.EXPO_PUBLIC_APP_URL,
  revenueCatIosApiKey: ENV.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  revenueCatAndroidApiKey: ENV.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  billingEntitlementKey: ENV.EXPO_PUBLIC_BILLING_ENTITLEMENT_KEY,
  revenueCatOfferingId: ENV.EXPO_PUBLIC_REVENUECAT_OFFERING_ID,
};
