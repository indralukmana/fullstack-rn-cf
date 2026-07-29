import type { BetterAuthOptions } from "better-auth";
import { organization } from "better-auth/plugins";

import type { Database } from "../../db/client";
import type { AuthEnv } from "./types";

import { createOrganizationOptions } from "./organization-options";
import {
  ensurePersonalOrganization,
  resolveDefaultActiveOrganizationId,
  type CreateOrganizationFn,
} from "./personal-organization";

export type OrganizationAuthAdapterContext = {
  env: AuthEnv;
  appUrl: string;
  db: Database;
  createOrganizationRef: { current: CreateOrganizationFn | null };
};

export type OrganizationAuthHooksContext = {
  db: Database;
  createOrganizationRef: { current: CreateOrganizationFn | null };
  prior?: BetterAuthOptions["databaseHooks"];
};

/**
 * Compose-time organization adapter: Better Auth organization plugin + personal Organization
 * on signup + default active Organization on session create.
 * This launchpad always applies it from createAuth; a no-tenancy fork omits this call.
 */
export function createOrganizationAuthPlugins(env: AuthEnv, appUrl: string) {
  return [organization(createOrganizationOptions(env, appUrl))];
}

export function createOrganizationAuthDatabaseHooks(
  ctx: OrganizationAuthHooksContext,
): NonNullable<BetterAuthOptions["databaseHooks"]> {
  const { db, createOrganizationRef, prior } = ctx;
  const priorUserCreateAfter = prior?.user?.create?.after;
  const priorSessionCreateBefore = prior?.session?.create?.before;

  return {
    ...prior,
    user: {
      ...prior?.user,
      create: {
        ...prior?.user?.create,
        after: async (user, context) => {
          if (priorUserCreateAfter) {
            await priorUserCreateAfter(user, context);
          }
          const createOrganization = createOrganizationRef.current;
          if (!createOrganization) {
            throw new Error("Auth is not ready to create a personal organization");
          }
          await ensurePersonalOrganization(createOrganization, db, user);
        },
      },
    },
    session: {
      ...prior?.session,
      create: {
        ...prior?.session?.create,
        before: async (session, context) => {
          if (priorSessionCreateBefore) {
            const priorResult = await priorSessionCreateBefore(session, context);
            if (priorResult) {
              return priorResult;
            }
          }
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
  };
}

export function applyOrganizationAuthAdapter(
  identity: BetterAuthOptions,
  ctx: OrganizationAuthAdapterContext,
): BetterAuthOptions {
  const { env, appUrl, db, createOrganizationRef } = ctx;
  return {
    ...identity,
    plugins: [...(identity.plugins ?? []), ...createOrganizationAuthPlugins(env, appUrl)],
    databaseHooks: createOrganizationAuthDatabaseHooks({
      db,
      createOrganizationRef,
      prior: identity.databaseHooks,
    }),
  };
}
