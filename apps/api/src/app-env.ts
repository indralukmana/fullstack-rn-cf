import type { AuthEnv } from "./lib/better-auth";
import type { AuthVariables } from "./middleware/require-auth";

export type AppEnv = {
  Bindings: AuthEnv;
  Variables: AuthVariables;
};
