import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
/**
 * Better Auth CLI config — uses a local SQLite file for schema generation only.
 * Runtime auth uses Cloudflare D1 via `src/lib/better-auth/index.ts`.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { createBetterAuthOptions } from "./src/lib/better-auth/options";

const sqlite = new Database(".data/auth-cli.sqlite");
const db = drizzle(sqlite);

export const auth = betterAuth({
  ...createBetterAuthOptions({
    ENVIRONMENT: "development",
    EMAIL_PROVIDER: "console",
  }),
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:8787",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-minimum-32-characters-long",
});
