import { createMiddleware } from "hono/factory";

import type { AuthVariables } from "./require-auth";

export const requireVerifiedAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    if (!c.var.user.emailVerified) {
      return c.json(
        {
          error: "email_verification_required",
          message: "Verify your email before purchasing a subscription",
        },
        403,
      );
    }
    return next();
  },
);
