import { createMiddleware } from "hono/factory";

import type { AuthEnv } from "../lib/better-auth";
import type { AuthVariables } from "./require-auth";

import { createDb } from "../db/client";

export function requireEntitlement(key: string) {
  return createMiddleware<{
    Bindings: AuthEnv;
    Variables: AuthVariables;
  }>(async (c, next) => {
    const access = await createDb(c.env.DB).query.entitlement.findFirst({
      where: {
        subjectType: "user",
        subjectId: c.var.user.id,
        key,
        status: { in: ["active", "grace_period"] },
        OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gt: new Date() } }],
      },
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
