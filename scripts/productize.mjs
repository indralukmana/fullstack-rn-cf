#!/usr/bin/env node
/**
 * Productize this launchpad for a new app identity.
 *
 * Does NOT rename npm package scopes (`@rn-cf/*`) — those stay as workspace names.
 * Use for display name, Expo identity, Wrangler/D1/queue names, and related defaults.
 *
 *   pnpm productize -- --name "Acme Learn" --slug acme-learn
 *   pnpm productize -- --name "Acme Learn" --slug acme-learn --scheme acmelearn --bundle-id com.acme.learn
 *   pnpm productize -- --dry-run --name "Acme Learn" --slug acme-learn
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildProductIdentity,
  buildReplacements,
  parseProductizeArgs,
  applyReplacements,
} from "./productize-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "apps/app/app.json",
  "apps/app/package.json",
  "apps/app/wrangler.toml",
  "apps/app/DESIGN.md",
  "apps/app/app/index.tsx",
  "apps/app/app/_layout.tsx",
  "apps/api/wrangler.toml",
  "apps/api/package.json",
  "apps/api/.env.schema",
  "apps/api/src/lib/config.ts",
  "apps/api/src/lib/better-auth/options.ts",
  "apps/docs/wrangler.toml",
  "apps/docs/astro.config.mjs",
  "apps/docs/src/content/docs/auth.md",
  "apps/docs/src/content/docs/derive-a-product.md",
  "apps/docs/src/content/docs/index.md",
  "apps/docs/src/content/docs/getting-started.md",
  "apps/e2e/playwright.config.ts",
  "apps/e2e/accessibility.spec.ts",
  "apps/api/vitest.config.ts",
  "README.md",
];

function main() {
  const args = parseProductizeArgs(process.argv.slice(2));
  if (args.help || !args.name || !args.slug) {
    console.log(`Usage:
  pnpm productize -- --name "Acme Learn" --slug acme-learn
  pnpm productize -- --name "Acme Learn" --slug acme-learn --scheme acmelearn --bundle-id com.acme.learn
  pnpm productize -- --dry-run --name "Acme Learn" --slug acme-learn

Options:
  --name          Display name (required)
  --slug          URL/product slug, lowercase with hyphens (required)
  --scheme        Expo URL scheme (default: slug without hyphens)
  --bundle-id     iOS/Android application id (default: com.example.<slug-without-hyphens>)
  --dry-run       Print planned replacements without writing
  --help          Show this help

Does not rename @rn-cf workspace packages. See Derive a product docs.`);
    process.exit(args.help ? 0 : 1);
  }

  const identity = buildProductIdentity(args);
  const replacements = buildReplacements(identity);

  console.log("Product identity:");
  console.log(`  name:      ${identity.name}`);
  console.log(`  slug:      ${identity.slug}`);
  console.log(`  scheme:    ${identity.scheme}`);
  console.log(`  bundleId:  ${identity.bundleId}`);
  console.log(`  api:       ${identity.apiWorker}`);
  console.log(`  web:       ${identity.webPages}`);
  console.log(`  docs:      ${identity.docsPages}`);
  console.log(`  d1:        ${identity.d1Name}`);
  console.log(`  queues:    ${identity.billingQueue}, ${identity.billingDlq}`);
  if (args.dryRun) {
    console.log("\nDry run — no files written.");
  }

  let changedFiles = 0;
  for (const relative of FILES) {
    const absolute = join(root, relative);
    let source;
    try {
      source = readFileSync(absolute, "utf8");
    } catch {
      console.warn(`Skip missing file: ${relative}`);
      continue;
    }
    const next = applyReplacements(source, replacements);
    if (next === source) {
      continue;
    }
    changedFiles += 1;
    console.log(`${args.dryRun ? "Would update" : "Updated"} ${relative}`);
    if (!args.dryRun) {
      writeFileSync(absolute, next);
    }
  }

  console.log(
    args.dryRun
      ? `\nDry run complete (${changedFiles} files would change).`
      : `\nProductize complete (${changedFiles} files updated). Review the diff, then run pnpm typecheck.`,
  );
  console.log("Reminder: @rn-cf package names were left unchanged on purpose.");
}

main();
