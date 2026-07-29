import { organizationClient } from "better-auth/client/plugins";

/**
 * Compose-time organization adapter for the Expo auth client.
 * This launchpad always includes it from auth-client.ts; a no-tenancy fork omits it.
 */
export function createOrganizationAuthClientPlugins() {
  return [organizationClient()];
}
