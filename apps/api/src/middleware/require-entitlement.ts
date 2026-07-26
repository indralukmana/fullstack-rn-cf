import { and, eq, gt, isNull, or } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import type { AuthEnv } from "../lib/better-auth";
import type { AuthVariables } from "./require-auth";

import { createDb } from "../db/client";
import { entitlement } from "../db/schema";

export function requireEntitlement(key: string) {
  return createMiddleware<{
    Bindings: AuthEnv;
    Variables: AuthVariables;
  }>(async (c, next) => {
    const access = await createDb(c.env.DB).query.entitlement.findFirst({
      where: and(
        eq(entitlement.subjectType, "user"),
        eq(entitlement.subjectId, c.var.user.id),
        eq(entitlement.key, key),
        or(eq(entitlement.status, "active"), eq(entitlement.status, "grace_period")),
        or(isNull(entitlement.expiresAt), gt(entitlement.expiresAt, new Date())),
      ),
      columns: { id: true },
    });
    if (!access) {
      return c.json(
        {
          error: "entitlement_required",
          message: `The ${key} entitlement is required`,
        },
        403,
      );
    }
    return next();
  });
}
