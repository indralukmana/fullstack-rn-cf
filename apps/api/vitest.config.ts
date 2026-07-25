import path from "node:path";
import { fileURLToPath } from "node:url";

import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(path.join(rootDir, "drizzle"));

      return {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            ENVIRONMENT: "development",
            SERVICE_NAME: "rn-cf-api",
            BETTER_AUTH_URL: "http://127.0.0.1:8787",
            BETTER_AUTH_SECRET: "test-secret-minimum-32-characters-long",
            CORS_ORIGINS:
              "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006",
            TRUSTED_ORIGINS: "",
            RATE_LIMIT_TTL: "60000",
            RATE_LIMIT_MAX: "10000",
            AUTH_RATE_LIMIT_TTL: "900000",
            AUTH_RATE_LIMIT_MAX: "10000",
            EMAIL_PROVIDER: "console",
            EMAIL_FROM: "RN CF <noreply@localhost>",
            RESEND_API_KEY: "",
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
