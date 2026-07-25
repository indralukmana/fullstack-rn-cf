import type { OrganizationRole } from "@rn-cf/types";
import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import type { AuthEnv } from "../lib/better-auth";
import type { AuthVariables } from "./require-auth";

import { createDb } from "../db/client";
import { member } from "../db/schema";
import { getSession } from "../lib/auth/session";

export type OrganizationContext = {
  id: string;
  role: OrganizationRole;
};

export type OrganizationVariables = {
  organization: OrganizationContext;
};

function normalizeRole(role: string): OrganizationRole {
  if (role === "owner" || role === "admin") {
    return role;
  }

  return "member";
}

export const requireOrganization = createMiddleware<{
  Bindings: AuthEnv;
  Variables: AuthVariables & OrganizationVariables;
}>(async (c, next) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: "unauthorized", message: "Authentication required" }, 401);
  }

  const organizationId = c.req.header("X-Organization-Id") ?? session.session.activeOrganizationId;
  if (!organizationId) {
    return c.json(
      {
        error: "organization_required",
        message: "Select an organization before using this resource",
      },
      400,
    );
  }

  const db = createDb(c.env.DB);
  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)),
    columns: {
      organizationId: true,
      role: true,
    },
  });

  if (!membership) {
    return c.json(
      {
        error: "forbidden",
        message: "You do not have access to this organization",
      },
      403,
    );
  }

  c.set("organization", {
    id: membership.organizationId,
    role: normalizeRole(membership.role),
  });

  return await next();
});
