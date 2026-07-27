import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { createDb } from "../../db/client";
import * as schema from "../../db/schema";
import { getRuntimeConfig, type AppBindings } from "../config";
import { createBetterAuthOptions } from "./options";
import { createOrganizationOptions } from "./organization-options";
import {
  ensurePersonalOrganization,
  resolveDefaultActiveOrganizationId,
  type CreateOrganizationFn,
} from "./personal-organization";

export type AuthEnv = AppBindings & {
  DB: D1Database;
};

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DB);
  const config = getRuntimeConfig(env);
  const createOrganizationRef: { current: CreateOrganizationFn | null } = { current: null };

  const auth = betterAuth({
    ...createBetterAuthOptions(env),
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    baseURL: config.authUrl,
    secret: config.authSecret,
    plugins: [expo(), organization(createOrganizationOptions(env, config.appUrl))],
    trustedOrigins: config.trustedOrigins,
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const createOrganization = createOrganizationRef.current;
            if (!createOrganization) {
              throw new Error("Auth is not ready to create a personal organization");
            }
            await ensurePersonalOrganization(createOrganization, db, user);
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            if (session.activeOrganizationId) {
              return { data: session };
            }
            const organizationId = await resolveDefaultActiveOrganizationId(db, session.userId);
            if (!organizationId) {
              return { data: session };
            }
            return {
              data: {
                ...session,
                activeOrganizationId: organizationId,
              },
            };
          },
        },
      },
    },
  });

  createOrganizationRef.current = (input) => auth.api.createOrganization(input);
  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
