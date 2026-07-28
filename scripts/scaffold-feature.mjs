#!/usr/bin/env node
/**
 * Scaffold a product feature screen + e2e stub against the shared feature_item API.
 *
 *   pnpm scaffold-feature -- --name notes
 *   pnpm scaffold-feature -- --name tasks --title "Tasks"
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { featureScreenTemplate } from "./templates/feature-screen.template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const out = { name: undefined, title: undefined, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") {
      out.help = true;
      continue;
    }
    if (arg === "--name") {
      out.name = argv[++i];
      continue;
    }
    if (arg === "--title") {
      out.title = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function screenTemplate({ title, featureKey }) {
  return featureScreenTemplate({ title, featureKey });
}

function e2eTemplate({ name, title, featureKey }) {
  return `import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test("${featureKey} feature screen loads for a signed-in user", async ({ page, request }) => {
  await registerViaUi(page, request, { name: "Feature Author" });
  await page.goto("/${name}");
  await expect(page.getByRole("heading", { name: "${title}" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toBeVisible();
});
`;
}

function wireStackScreen(name, title) {
  const layoutPath = join(root, "apps/app/app/_layout.tsx");
  let source = readFileSync(layoutPath, "utf8");
  if (source.includes(`name="${name}"`)) {
    return { path: layoutPath, changed: false };
  }
  const anchor = `<Stack.Screen name="account-data"`;
  if (!source.includes(anchor)) {
    throw new Error(`Could not find account-data Stack.Screen anchor in ${layoutPath}`);
  }
  const insertion = `<Stack.Screen name="${name}" options={withBodyTitle("${title}")} />\n          ${anchor}`;
  source = source.replace(anchor, insertion);
  writeFileSync(layoutPath, source);
  return { path: layoutPath, changed: true };
}

function wireAccountLink(name, title) {
  const actionsPath = join(root, "apps/app/src/parts/me/me-account-actions.tsx");
  let source = readFileSync(actionsPath, "utf8");
  if (source.includes(`href="./${name}"`)) {
    return { path: actionsPath, changed: false };
  }
  const anchor = `<NavRow href="./organizations" label="Organizations" />`;
  if (!source.includes(anchor)) {
    throw new Error(`Could not find organizations Account link anchor in ${actionsPath}`);
  }
  const insertion = `<NavRow href="./${name}" label="${title}" />
            ${anchor}`;
  source = source.replace(anchor, insertion);
  writeFileSync(actionsPath, source);
  return { path: actionsPath, changed: true };
}

function assertWireTargets(name) {
  const layoutPath = join(root, "apps/app/app/_layout.tsx");
  const actionsPath = join(root, "apps/app/src/parts/me/me-account-actions.tsx");
  const layout = readFileSync(layoutPath, "utf8");
  const actions = readFileSync(actionsPath, "utf8");
  if (!layout.includes(`name="${name}"`) && !layout.includes(`<Stack.Screen name="account-data"`)) {
    throw new Error(`Could not find account-data Stack.Screen anchor in ${layoutPath}`);
  }
  if (
    !actions.includes(`href="./${name}"`) &&
    !actions.includes(`<NavRow href="./organizations" label="Organizations" />`)
  ) {
    throw new Error(`Could not find organizations Account link anchor in ${actionsPath}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.name) {
    console.log(`Usage:
  pnpm scaffold-feature -- --name notes
  pnpm scaffold-feature -- --name tasks --title "Tasks"

Creates:
  apps/app/app/<name>.tsx
  apps/e2e/<name>.spec.ts

Uses shared /api/features/{featureKey}/items (feature_item table).
Wires Stack.Screen in _layout.tsx and an Account link in src/parts/me/me-account-actions.tsx when missing.`);
    process.exit(args.help ? 0 : 1);
  }

  const name = args.name.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(name)) {
    throw new Error(`Invalid --name "${name}". Use a feature key slug like "notes".`);
  }
  const title = (args.title ?? titleCase(name)).trim();
  const featureKey = name;

  const screenPath = join(root, "apps/app/app", `${name}.tsx`);
  const e2ePath = join(root, "apps/e2e", `${name}.spec.ts`);
  if (existsSync(screenPath) || existsSync(e2ePath)) {
    throw new Error(`Refusing to overwrite existing files for "${name}".`);
  }

  assertWireTargets(name);

  mkdirSync(dirname(screenPath), { recursive: true });
  writeFileSync(screenPath, screenTemplate({ title, featureKey }));
  writeFileSync(e2ePath, e2eTemplate({ name, title, featureKey }));
  const layout = wireStackScreen(name, title);
  const account = wireAccountLink(name, title);

  console.log(`Created ${screenPath}`);
  console.log(`Created ${e2ePath}`);
  console.log(
    layout.changed
      ? `Wired Stack.Screen in ${layout.path}`
      : `Stack.Screen already present in ${layout.path}`,
  );
  console.log(
    account.changed
      ? `Wired Account link in ${account.path}`
      : `Account link already present in ${account.path}`,
  );
  console.log(`
Next:
  1. pnpm --filter @rn-cf/app typecheck
  2. pnpm --filter @rn-cf/e2e test ${name}.spec.ts
`);
}

main();
