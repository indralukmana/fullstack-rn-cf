import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";

import app from "../../src/index";

const webOrigin = "http://127.0.0.1:8081";
const apiOrigin = "http://127.0.0.1:8787";

export async function postAuth(path: string, body: Record<string, string>) {
  const ctx = createExecutionContext();
  const response = await app.fetch(
    new Request(`${apiOrigin}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: webOrigin,
      },
      body: JSON.stringify(body),
    }),
    env,
    ctx,
  );

  await waitOnExecutionContext(ctx);
  return response;
}

export async function getApi(path: string, cookie?: string | null) {
  return requestApi("GET", path, { cookie });
}

export async function postApi(
  path: string,
  body?: Record<string, unknown>,
  cookie?: string | null,
) {
  return requestApi("POST", path, { body, cookie });
}

export async function patchApi(
  path: string,
  body: Record<string, unknown>,
  cookie?: string | null,
) {
  return requestApi("PATCH", path, { body, cookie });
}

export async function deleteApi(path: string, cookie?: string | null) {
  return requestApi("DELETE", path, { cookie });
}

async function requestApi(
  method: string,
  path: string,
  options: {
    body?: Record<string, unknown>;
    cookie?: string | null;
  } = {},
) {
  const ctx = createExecutionContext();
  const headers: Record<string, string> = {
    Origin: webOrigin,
  };

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await app.fetch(
    new Request(`${apiOrigin}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
    env,
    ctx,
  );

  await waitOnExecutionContext(ctx);
  return response;
}

export async function registerUser(email: string, name = "Quiz Author") {
  const signUp = await postAuth("/api/auth/sign-up/email", {
    email,
    password: "testpassword123",
    name,
  });

  return {
    response: signUp,
    cookie: getSessionCookie(signUp),
  };
}

export function getSessionCookie(response: Response): string | null {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    return null;
  }

  return setCookie.split(";")[0] ?? null;
}
