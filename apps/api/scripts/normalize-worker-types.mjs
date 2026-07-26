import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const typesPath = join(apiRoot, "worker-configuration.d.ts");
const input = readFileSync(typesPath, "utf8");
const normalized = input.replace(
  /--env-file=\/tmp\/varlock-types-env-[a-f0-9]+/,
  "--env-file=<generated-env>",
);

if (normalized === input && !input.includes("--env-file=<generated-env>")) {
  throw new Error("Could not normalize Wrangler's temporary env-file path");
}
writeFileSync(typesPath, normalized);
