import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { env } from "./env";

/** Absolute URL used as Better Auth callbackURL / redirectTo. */
export function appCallbackUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (Platform.OS === "web") {
    return `${env.appUrl.replace(/\/$/, "")}${normalized}`;
  }

  return Linking.createURL(normalized);
}
