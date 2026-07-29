import { expo } from "@better-auth/expo";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import type { Database } from "../../db/client";
import type { RuntimeConfig } from "../config";
import type { AuthEnv } from "./types";

import * as schema from "../../db/schema";
import { createBetterAuthOptions } from "./options";

/**
 * Identity-only Better Auth plugins (Expo). Organization is a separate adapter.
 */
export function createIdentityAuthPlugins() {
  return [expo()];
}

/**
 * Core auth options: email/password, verification, Expo, D1 adapter.
 * Does not include the organization plugin or personal-org session hooks.
 */
export function createIdentityAuthOptions(
  env: AuthEnv,
  db: Database,
  config: RuntimeConfig,
): BetterAuthOptions {
  return {
    ...createBetterAuthOptions(env),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    baseURL: config.authUrl,
    secret: config.authSecret,
    plugins: createIdentityAuthPlugins(),
    trustedOrigins: config.trustedOrigins,
  };
}
