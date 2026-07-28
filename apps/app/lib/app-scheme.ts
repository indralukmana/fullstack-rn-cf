import Constants from "expo-constants";

/** Expo URL scheme from app.json — keep in sync with Better Auth trusted origins. */
export function getAppScheme(): string {
  const raw = Constants.expoConfig?.scheme;
  const scheme = Array.isArray(raw) ? raw[0] : raw;
  if (typeof scheme !== "string" || !/^[a-z][a-z0-9]*$/.test(scheme)) {
    throw new Error("expo.scheme must be set in app.json (lowercase letters/numbers)");
  }
  return scheme;
}
