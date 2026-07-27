import type { OrganizationRole } from "@rn-cf/types";
import { createMiddleware } from "hono/factory";

import type { AuthEnv } from "../lib/better-auth";
import type { AuthVariables } from "./require-auth";
import type { OrganizationVariables } from "./require-organization";

/**
 * Compose after `requireOrganization`. Restricts the route to membership roles.
 */
export function requireOrganizationRole(...roles: OrganizationRole[]) {
  const allowed = new Set(roles);

  return createMiddleware<{
    Bindings: AuthEnv;
    Variables: AuthVariables & OrganizationVariables;
  }>(async (c, next) => {
    if (!allowed.has(c.var.organization.role)) {
      return c.json(
        {
          error: "forbidden",
          message: "You do not have permission to manage billing for this organization",
        },
        403,
      );
    }

    return await next();
  });
}
