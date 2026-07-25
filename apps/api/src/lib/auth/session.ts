import type { Context } from "hono";

import { createAuth, type AuthEnv } from "../better-auth";

export async function getSession(c: Context) {
  const auth = createAuth(c.env as AuthEnv);

  return auth.api.getSession({
    headers: c.req.raw.headers,
  });
}

export async function requireSession(c: Context) {
  const session = await getSession(c);

  if (!session) {
    return null;
  }

  return session;
}
