import { describe, expect, it } from "vitest";

import type { AppBindings } from "../../src/lib/config";

import { getRuntimeConfig } from "../../src/lib/config";

const productionEnv: AppBindings = {
  ENVIRONMENT: "production",
  BETTER_AUTH_URL: "https://api.example.com",
  BETTER_AUTH_SECRET: "production-secret-that-is-at-least-32-characters",
  APP_URL: "https://app.example.com",
  CORS_ORIGINS: "https://app.example.com",
  EMAIL_PROVIDER: "cloudflare",
  EMAIL_FROM: "RN CF <noreply@example.com>",
  EMAIL: {
    send: async () => ({ messageId: "test-message" }),
  },
  STRIPE_SECRET_KEY: "stripe-secret",
  STRIPE_WEBHOOK_SECRET: "stripe-webhook-secret",
  REVENUECAT_WEBHOOK_AUTHORIZATION: "Bearer revenuecat-webhook-secret",
  REVENUECAT_SECRET_API_KEY: "revenuecat-secret",
  BILLING_ENTITLEMENT_KEY: "pro",
  BILLING_GRACE_PERIOD_DAYS: 3,
  STRIPE_PRICE_MONTHLY: "price_monthly",
  STRIPE_PRICE_YEARLY: "price_yearly",
  REVENUECAT_ENTITLEMENT_ID: "pro",
  REVENUECAT_OFFERING_ID: "default",
  REVENUECAT_IOS_APP_ID: "app_ios",
  REVENUECAT_ANDROID_APP_ID: "app_android",
  REVENUECAT_IOS_PRODUCT_MONTHLY: "ios_pro_monthly",
  REVENUECAT_IOS_PRODUCT_YEARLY: "ios_pro_yearly",
  REVENUECAT_ANDROID_PRODUCT_MONTHLY: "android_pro_monthly",
  REVENUECAT_ANDROID_PRODUCT_YEARLY: "android_pro_yearly",
};

describe("getRuntimeConfig", () => {
  it.each([undefined, "", "prod", "Development"])(
    "rejects an unknown environment value: %s",
    (environment) => {
      expect(() =>
        getRuntimeConfig({
          ...productionEnv,
          ENVIRONMENT: environment,
        }),
      ).toThrow("ENVIRONMENT must be either development or production");
    },
  );

  it("requires authentication configuration in every environment", () => {
    expect(() =>
      getRuntimeConfig({
        ENVIRONMENT: "development",
        BETTER_AUTH_SECRET: "development-secret",
      }),
    ).toThrow("BETTER_AUTH_URL must be set");

    expect(() =>
      getRuntimeConfig({
        ENVIRONMENT: "development",
        BETTER_AUTH_URL: "http://127.0.0.1:8787",
      }),
    ).toThrow("BETTER_AUTH_SECRET must be set");
  });

  it("rejects insecure production URLs", () => {
    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        BETTER_AUTH_URL: "http://api.example.com",
      }),
    ).toThrow("BETTER_AUTH_URL must use HTTPS in production");

    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        CORS_ORIGINS: "http://app.example.com",
      }),
    ).toThrow("CORS_ORIGINS entries must use HTTPS in production");

    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        APP_URL: "http://app.example.com",
      }),
    ).toThrow("APP_URL must use HTTPS in production");
  });

  it("rejects CORS URLs that are not exact origins", () => {
    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        CORS_ORIGINS: "https://app.example.com/path",
      }),
    ).toThrow("CORS_ORIGINS entries must be origins without paths or trailing slashes");
  });

  it("requires Cloudflare Email Service in production", () => {
    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        EMAIL_PROVIDER: "console",
      }),
    ).toThrow("EMAIL_PROVIDER must be cloudflare in production");

    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        EMAIL: undefined,
      }),
    ).toThrow("EMAIL binding must be configured in production");

    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        EMAIL_FROM: "RN CF <noreply@localhost>",
      }),
    ).toThrow("EMAIL_FROM must use a verified production domain");
  });

  it.each([
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "REVENUECAT_WEBHOOK_AUTHORIZATION",
    "REVENUECAT_SECRET_API_KEY",
    "STRIPE_PRICE_MONTHLY",
    "STRIPE_PRICE_YEARLY",
    "REVENUECAT_ENTITLEMENT_ID",
    "REVENUECAT_OFFERING_ID",
    "REVENUECAT_IOS_APP_ID",
    "REVENUECAT_ANDROID_APP_ID",
    "REVENUECAT_IOS_PRODUCT_MONTHLY",
    "REVENUECAT_IOS_PRODUCT_YEARLY",
    "REVENUECAT_ANDROID_PRODUCT_MONTHLY",
    "REVENUECAT_ANDROID_PRODUCT_YEARLY",
  ] as const)("requires the %s billing credential in production", (name) => {
    expect(() =>
      getRuntimeConfig({
        ...productionEnv,
        [name]: undefined,
      }),
    ).toThrow(`${name} must be set`);
  });

  it("returns normalized validated production configuration", () => {
    expect(getRuntimeConfig(productionEnv)).toMatchObject({
      environment: "production",
      isProduction: true,
      authUrl: "https://api.example.com",
      authSecret: productionEnv.BETTER_AUTH_SECRET,
      appUrl: "https://app.example.com",
      corsOrigins: ["https://app.example.com"],
      billingEntitlementKey: "pro",
      billingGracePeriodDays: 3,
    });
  });
});
