import { createMiddleware } from "hono/factory";

import { getSession } from "../lib/auth/session";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type AuthVariables = {
  user: AuthUser;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const session = await getSession(c);

  if (!session) {
    return c.json({ error: "unauthorized", message: "Authentication required" }, 401);
  }

  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
  });

  return await next();
});
