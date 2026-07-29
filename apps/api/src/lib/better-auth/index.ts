import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

import type { CreateOrganizationFn } from "./personal-organization";
import type { AuthEnv } from "./types";

import { createDb } from "../../db/client";
import { getRuntimeConfig } from "../config";
import { createIdentityAuthOptions } from "./identity-auth";
import { createOrganizationAuthDatabaseHooks } from "./organization-auth-adapter";
import { createOrganizationOptions } from "./organization-options";

export type { AuthEnv } from "./types";
export { createIdentityAuthOptions, createIdentityAuthPlugins } from "./identity-auth";
export {
  applyOrganizationAuthAdapter,
  createOrganizationAuthDatabaseHooks,
  createOrganizationAuthPlugins,
} from "./organization-auth-adapter";

/**
 * Public auth entry for this launchpad: identity core + organization adapter composed in.
 * Plugins are listed as a fresh tuple so Better Auth can infer organization API types.
 * Forks that drop multi-tenancy: betterAuth(createIdentityAuthOptions(...)) and skip org.
 */
export function createAuth(env: AuthEnv) {
  const db = createDb(env.DB);
  const config = getRuntimeConfig(env);
  const createOrganizationRef: { current: CreateOrganizationFn | null } = { current: null };

  const identity = createIdentityAuthOptions(env, db, config);

  const auth = betterAuth({
    ...identity,
    // Literal plugin tuple (do not spread identity.plugins) — required for InferAPI.
    plugins: [expo(), organization(createOrganizationOptions(env, config.appUrl))],
    databaseHooks: createOrganizationAuthDatabaseHooks({
      db,
      createOrganizationRef,
      prior: identity.databaseHooks,
    }),
  });

  createOrganizationRef.current = (input) => auth.api.createOrganization(input);
  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
