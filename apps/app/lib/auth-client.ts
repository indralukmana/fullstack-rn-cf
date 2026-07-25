import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.apiUrl,
  plugins: [
    expoClient({
      scheme: "rn-cf",
      storagePrefix: "rn-cf",
      storage: SecureStore,
    }),
  ],
});
