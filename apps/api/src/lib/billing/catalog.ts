import type { AppBindings } from "../config";

export type BillingInterval = "monthly" | "yearly";
export type BillingPlatform = "ios" | "android";

function requireCatalogValue(
  env: AppBindings,
  key:
    | "BILLING_ENTITLEMENT_KEY"
    | "STRIPE_PRICE_MONTHLY"
    | "STRIPE_PRICE_YEARLY"
    | "REVENUECAT_ENTITLEMENT_ID"
    | "REVENUECAT_OFFERING_ID"
    | "REVENUECAT_IOS_APP_ID"
    | "REVENUECAT_ANDROID_APP_ID"
    | "REVENUECAT_IOS_PRODUCT_MONTHLY"
    | "REVENUECAT_IOS_PRODUCT_YEARLY"
    | "REVENUECAT_ANDROID_PRODUCT_MONTHLY"
    | "REVENUECAT_ANDROID_PRODUCT_YEARLY",
): string {
  const value = env[key];
  if (!value?.trim()) {
    throw new Error(`${key} must be set`);
  }
  return value.trim();
}

export function getBillingCatalog(env: AppBindings) {
  const stripe = {
    monthly: requireCatalogValue(env, "STRIPE_PRICE_MONTHLY"),
    yearly: requireCatalogValue(env, "STRIPE_PRICE_YEARLY"),
  } as const;
  const revenueCat = {
    entitlementId: requireCatalogValue(env, "REVENUECAT_ENTITLEMENT_ID"),
    offeringId: requireCatalogValue(env, "REVENUECAT_OFFERING_ID"),
    apps: {
      ios: requireCatalogValue(env, "REVENUECAT_IOS_APP_ID"),
      android: requireCatalogValue(env, "REVENUECAT_ANDROID_APP_ID"),
    },
    products: {
      ios: {
        monthly: requireCatalogValue(env, "REVENUECAT_IOS_PRODUCT_MONTHLY"),
        yearly: requireCatalogValue(env, "REVENUECAT_IOS_PRODUCT_YEARLY"),
      },
      android: {
        monthly: requireCatalogValue(env, "REVENUECAT_ANDROID_PRODUCT_MONTHLY"),
        yearly: requireCatalogValue(env, "REVENUECAT_ANDROID_PRODUCT_YEARLY"),
      },
    },
  } as const;

  if (stripe.monthly === stripe.yearly) {
    throw new Error("Stripe monthly and yearly price IDs must be different");
  }
  for (const [platform, products] of Object.entries(revenueCat.products)) {
    if (products.monthly === products.yearly) {
      throw new Error(`RevenueCat ${platform} monthly and yearly product IDs must be different`);
    }
  }

  return {
    entitlementKey: requireCatalogValue(env, "BILLING_ENTITLEMENT_KEY"),
    stripe,
    revenueCat,
  } as const;
}

export type BillingCatalog = ReturnType<typeof getBillingCatalog>;
