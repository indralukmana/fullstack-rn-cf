import path from "node:path";
import { fileURLToPath } from "node:url";

import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

import { readNestedD1Migrations } from "./scripts/read-d1-migrations.mjs";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readNestedD1Migrations(path.join(rootDir, "drizzle"));

      return {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            ENVIRONMENT: "development",
            SERVICE_NAME: "rn-cf-api",
            BETTER_AUTH_URL: "http://127.0.0.1:8787",
            BETTER_AUTH_SECRET: "test-secret-minimum-32-characters-long",
            APP_URL: "http://127.0.0.1:8081",
            CORS_ORIGINS: "http://localhost:8081,http://127.0.0.1:8081,http://10.0.2.2:8081",
            TRUSTED_ORIGINS: "",
            RATE_LIMIT_TTL: "60000",
            RATE_LIMIT_MAX: "10000",
            AUTH_RATE_LIMIT_TTL: "900000",
            AUTH_RATE_LIMIT_MAX: "10000",
            EMAIL_PROVIDER: "console",
            EMAIL_FROM: "RN CF <noreply@localhost>",
            STRIPE_SECRET_KEY: "stripe-test-secret",
            STRIPE_WEBHOOK_SECRET: "stripe-webhook-test-secret",
            REVENUECAT_WEBHOOK_AUTHORIZATION: "Bearer revenuecat-webhook-test-secret",
            REVENUECAT_SECRET_API_KEY: "revenuecat-test-secret",
            BILLING_ENTITLEMENT_KEY: "pro",
            BILLING_GRACE_PERIOD_DAYS: "3",
            STRIPE_PRICE_MONTHLY: "price_test_monthly",
            STRIPE_PRICE_YEARLY: "price_test_yearly",
            REVENUECAT_ENTITLEMENT_ID: "pro",
            REVENUECAT_OFFERING_ID: "default",
            REVENUECAT_IOS_APP_ID: "app_ios_test",
            REVENUECAT_ANDROID_APP_ID: "app_android_test",
            REVENUECAT_IOS_PRODUCT_MONTHLY: "ios_pro_monthly",
            REVENUECAT_IOS_PRODUCT_YEARLY: "ios_pro_yearly",
            REVENUECAT_ANDROID_PRODUCT_MONTHLY: "android_pro_monthly",
            REVENUECAT_ANDROID_PRODUCT_YEARLY: "android_pro_yearly",
          },
        },
      };
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup/apply-migrations.ts"],
  },
});
