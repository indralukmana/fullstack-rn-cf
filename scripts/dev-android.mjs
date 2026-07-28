#!/usr/bin/env node
/**
 * Android emulator dev loop with host-loopback URL overrides.
 *
 *   pnpm dev:android          # Metro + open installed dev client
 *   pnpm dev:android -- --run # first-time / native-dep: local Gradle build + install
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runNative = process.argv.includes("--run");

process.env.EXPO_PUBLIC_API_URL ??= "http://10.0.2.2:8787";
process.env.EXPO_PUBLIC_APP_URL ??= "http://10.0.2.2:8081";

const expoArgs = runNative
  ? ["exec", "expo", "run:android", "--port", "8081"]
  : ["exec", "expo", "start", "--android", "--port", "8081"];

const result = spawnSync("pnpm", ["--filter", "@rn-cf/app", ...expoArgs], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
