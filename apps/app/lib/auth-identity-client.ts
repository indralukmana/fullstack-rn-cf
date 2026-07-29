import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { getAppScheme } from "./app-scheme";

/**
 * Identity-only Better Auth client plugins (Expo + SecureStore).
 * Organization client plugin is a separate compose-time adapter.
 */
export function createIdentityAuthClientPlugins() {
  const scheme = getAppScheme();
  return [
    expoClient({
      scheme,
      storagePrefix: scheme,
      storage: SecureStore,
    }),
  ];
}
