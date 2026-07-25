import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { createDb } from "../../db/client";
import * as schema from "../../db/schema";
import { getRuntimeConfig, type AppBindings } from "../config";
import { createBetterAuthOptions } from "./options";
import { createOrganizationOptions } from "./organization-options";

export type AuthEnv = AppBindings & {
  DB: D1Database;
};

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DB);
  const config = getRuntimeConfig(env);

  return betterAuth({
    ...createBetterAuthOptions(env),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    baseURL: config.authUrl,
    secret: config.authSecret,
    plugins: [expo(), organization(createOrganizationOptions(env, config.appUrl))],
    trustedOrigins: config.trustedOrigins,
  });
}

export type Auth = ReturnType<typeof createAuth>;
