import { describe, expect, it } from "vitest";

import { getBillingCatalog } from "../../src/lib/billing/catalog";

const env = {
  BILLING_ENTITLEMENT_KEY: "pro",
  STRIPE_PRICE_MONTHLY: "price_monthly",
  STRIPE_PRICE_YEARLY: "price_yearly",
  REVENUECAT_ENTITLEMENT_ID: "pro",
  REVENUECAT_OFFERING_ID: "default",
  REVENUECAT_IOS_APP_ID: "app_ios",
  REVENUECAT_ANDROID_APP_ID: "app_android",
  REVENUECAT_IOS_PRODUCT_MONTHLY: "ios_monthly",
  REVENUECAT_IOS_PRODUCT_YEARLY: "ios_yearly",
  REVENUECAT_ANDROID_PRODUCT_MONTHLY: "android_monthly",
  REVENUECAT_ANDROID_PRODUCT_YEARLY: "android_yearly",
};

describe("getBillingCatalog", () => {
  it("returns the closed provider mapping", () => {
    expect(getBillingCatalog(env)).toEqual({
      entitlementKey: "pro",
      stripe: {
        monthly: "price_monthly",
        yearly: "price_yearly",
      },
      revenueCat: {
        entitlementId: "pro",
        offeringId: "default",
        apps: {
          ios: "app_ios",
          android: "app_android",
        },
        products: {
          ios: {
            monthly: "ios_monthly",
            yearly: "ios_yearly",
          },
          android: {
            monthly: "android_monthly",
            yearly: "android_yearly",
          },
        },
      },
    });
  });

  it("rejects incomplete and ambiguous mappings", () => {
    expect(() => getBillingCatalog({ ...env, STRIPE_PRICE_MONTHLY: "" })).toThrow(
      "STRIPE_PRICE_MONTHLY must be set",
    );
    expect(() =>
      getBillingCatalog({ ...env, REVENUECAT_IOS_PRODUCT_YEARLY: "ios_monthly" }),
    ).toThrow("RevenueCat ios monthly and yearly product IDs must be different");
  });
});
