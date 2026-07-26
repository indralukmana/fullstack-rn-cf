import * as Linking from "expo-linking";
import type { Href } from "expo-router";

function normalizedPath(path: string | null | undefined): string {
  return (path ?? "").replace(/^\//, "").replace(/\/$/, "");
}

/**
 * Map an incoming Expo / Better Auth callback URL onto an in-app route.
 * Returns null when the URL is not a known app deep link.
 */
export function routeFromIncomingUrl(url: string): Href | null {
  const parsed = Linking.parse(url);
  const path = normalizedPath(parsed.path);
  const query = parsed.queryParams ?? {};

  if (path === "accept-invitation" || path.endsWith("accept-invitation")) {
    const id = typeof query.id === "string" ? query.id : null;
    if (!id) {
      return "/accept-invitation";
    }
    return { pathname: "/accept-invitation", params: { id } };
  }

  if (path === "reset-password" || path.endsWith("reset-password")) {
    const token = typeof query.token === "string" ? query.token : null;
    const error = typeof query.error === "string" ? query.error : null;
    if (token) {
      return { pathname: "/reset-password", params: { token } };
    }
    if (error) {
      return { pathname: "/reset-password", params: { error } };
    }
    return "/reset-password";
  }

  if (path === "me" || path.endsWith("/me")) {
    return "/me";
  }

  return null;
}
