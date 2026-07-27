#!/usr/bin/env node
/**
 * Seed local demo owner/member + shared workspace via the API.
 *
 *   pnpm seed:demo
 *   pnpm seed:demo -- --api-url http://127.0.0.1:8787
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const out = { apiUrl: "http://127.0.0.1:8787", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") {
      out.help = true;
      continue;
    }
    if (arg === "--api-url") {
      out.apiUrl = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  pnpm seed:demo
  pnpm seed:demo -- --api-url http://127.0.0.1:8787

Requires the API running locally (pnpm dev:api). Disabled in production.`);
    process.exit(0);
  }

  const response = await fetch(new URL("/api/dev/seed", args.apiUrl), {
    method: "POST",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`Seed failed (${response.status}):`, body);
    process.exit(1);
  }

  console.log("Demo seed ready.\n");
  console.log(`Password (both users): ${body.password}`);
  console.log(`Owner:  ${body.owner.email}  (${body.owner.name})`);
  console.log(`Member: ${body.member.email} (${body.member.name})`);
  console.log(`Workspace: ${body.workspace.name} [${body.workspace.slug}]`);
  console.log("\nCreated flags:", body.created);
  console.log(`\nApp: open ${process.env.APP_URL ?? "http://127.0.0.1:8081"}/sign-in`);
  void root;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
