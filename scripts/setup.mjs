#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyEnvIfMissing(examplePath, targetPath) {
  if (existsSync(targetPath)) {
    console.log(`Skipped ${targetPath} (already exists)`);
    return;
  }

  copyFileSync(examplePath, targetPath);
  console.log(`Created ${targetPath}`);
}

copyEnvIfMissing(join(root, "apps/app/.env.example"), join(root, "apps/app/.env"));
copyEnvIfMissing(join(root, "apps/api/.env.example"), join(root, "apps/api/.env"));

console.log("Applying local D1 migrations...");
run("pnpm", ["--filter", "@rn-cf/api", "db:migrate:local"]);

if (process.env.CI) {
  console.log("Skipped Playwright install (CI environment)");
} else {
  console.log("Installing Playwright Chromium...");
  run("pnpm", ["--filter", "@rn-cf/e2e", "exec", "playwright", "install", "chromium"]);
}

console.log("Setup complete.");
