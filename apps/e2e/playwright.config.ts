import { defineConfig, devices } from "@playwright/test";

const webPort = 8081;
const apiPort = 8787;
const apiEnv = {
  ...process.env,
  ENVIRONMENT: "development",
  SERVICE_NAME: "rn-cf-api",
  BETTER_AUTH_URL: `http://127.0.0.1:${apiPort}`,
  BETTER_AUTH_SECRET: "e2e-only-secret-minimum-32-characters-long",
  APP_URL: `http://127.0.0.1:${webPort}`,
  CORS_ORIGINS: `http://127.0.0.1:${webPort}`,
  TRUSTED_ORIGINS: "",
  RATE_LIMIT_TTL: "60000",
  RATE_LIMIT_MAX: "10000",
  AUTH_RATE_LIMIT_TTL: "900000",
  AUTH_RATE_LIMIT_MAX: "10000",
  EMAIL_PROVIDER: "console",
  EMAIL_FROM: "RN CF <noreply@localhost>",
  BILLING_ENTITLEMENT_KEY: "pro",
  BILLING_GRACE_PERIOD_DAYS: "3",
};

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  // Local wrangler/workerd is unstable under heavy parallel signup load.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: `pnpm --filter @rn-cf/app exec expo start --web --port ${webPort}`,
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @rn-cf/api db:migrate:local && pnpm --filter @rn-cf/api dev`,
      env: apiEnv,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 45_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
