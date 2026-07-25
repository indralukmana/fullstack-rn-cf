import { env } from "cloudflare:workers";

function readBinding(name: string): unknown {
  return Reflect.get(env, name);
}

/**
 * Official varlock CF init requires a `__VARLOCK_ENV` binding produced by
 * `varlock-wrangler`. Skip in vitest/miniflare when that binding is absent;
 * app code still reads validated secrets from Worker bindings.
 */
export async function initVarlockIfPresent() {
  const hasEnv = typeof readBinding("__VARLOCK_ENV") === "string";
  const hasChunks = typeof readBinding("__VARLOCK_ENV_CHUNKS") === "string";

  if (hasEnv || hasChunks) {
    await import("@varlock/cloudflare-integration/init");
  }
}
