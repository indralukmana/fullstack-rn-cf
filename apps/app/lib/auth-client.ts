import { createAuthClient } from "better-auth/react";

import { createIdentityAuthClientPlugins } from "./auth-identity-client";
import { createOrganizationAuthClientPlugins } from "./auth-organization-client";
import { env } from "./env";

/**
 * Launchpad auth client: identity (Expo) + organization adapter composed in.
 * Omit createOrganizationAuthClientPlugins for a no-tenancy fork.
 */
export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  plugins: [...createIdentityAuthClientPlugins(), ...createOrganizationAuthClientPlugins()],
});
