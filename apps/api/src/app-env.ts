import type { AuthEnv } from "./lib/better-auth";
import type { AuthVariables } from "./middleware/require-auth";
import type { OrganizationVariables } from "./middleware/require-organization";

export type AppEnv = {
  Bindings: AuthEnv;
  Variables: AuthVariables & OrganizationVariables;
};
