import { ENV } from "varlock/env";

export const env = {
  apiUrl: ENV.EXPO_PUBLIC_API_URL,
  appUrl: ENV.EXPO_PUBLIC_APP_URL,
};
