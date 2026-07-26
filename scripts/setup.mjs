#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, renameSync, writeFileSync } from "node:fs";
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

function prepareLocalEnv(workspace, initialValues) {
  const legacyPath = join(workspace, ".env");
  const localPath = join(workspace, ".env.local");

  if (existsSync(legacyPath) && !existsSync(localPath)) {
    renameSync(legacyPath, localPath);
    console.log(`Migrated ${legacyPath} to ${localPath}`);
    return;
  }

  if (existsSync(legacyPath)) {
    console.warn(`Both ${legacyPath} and ${localPath} exist; review and remove the legacy file`);
  }
  if (existsSync(localPath) || initialValues.length === 0) {
    return;
  }

  writeFileSync(localPath, `${initialValues.join("\n")}\n`, { mode: 0o600 });
  console.log(`Created ${localPath}`);
}

prepareLocalEnv(join(root, "apps/app"), []);
prepareLocalEnv(join(root, "apps/api"), [`BETTER_AUTH_SECRET=${randomBytes(32).toString("hex")}`]);

console.log("Applying local D1 migrations...");
run("pnpm", ["--filter", "@rn-cf/api", "db:migrate:local"]);

if (process.env.CI) {
  console.log("Skipped Playwright install (CI environment)");
} else {
  console.log("Installing Playwright Chromium...");
  run("pnpm", ["--filter", "@rn-cf/e2e", "exec", "playwright", "install", "chromium"]);
}

console.log("Setup complete.");
