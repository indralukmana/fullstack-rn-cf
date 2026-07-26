#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "packages/api-client");
const outputPath = join(outputDir, "openapi.json");
const port = 8799;
const docUrl = `http://127.0.0.1:${port}/doc`;

const child = spawn(
  "pnpm",
  [
    "--filter",
    "@rn-cf/api",
    "exec",
    "varlock-wrangler",
    "dev",
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: root,
    detached: process.platform !== "win32",
    stdio: "ignore",
    shell: process.platform === "win32",
  },
);

let exported = false;

try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await delay(500);

    try {
      const response = await fetch(docUrl);

      if (!response.ok) {
        continue;
      }

      const spec = await response.json();
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
      exported = true;
      console.log(`Wrote ${outputPath}`);
      break;
    } catch {
      // Wrangler still starting.
    }
  }

  if (!exported) {
    console.error(`Timed out waiting for ${docUrl}`);
    process.exit(1);
  }
} finally {
  try {
    if (process.platform === "win32") {
      child.kill("SIGTERM");
    } else if (child.pid !== undefined) {
      process.kill(-child.pid, "SIGTERM");
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // The development server may already have exited after an export failure.
  }
}
