/**
 * Shared AuthEnv for Better Auth construction.
 * Kept tiny so identity and organization adapters do not import index.ts.
 */
import type { AppBindings } from "../config";

export type AuthEnv = AppBindings & {
  DB: D1Database;
};
