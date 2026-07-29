#!/usr/bin/env node
/**
 * Ban silencing modularity / complexity oxlint rules without an explicit allowlist.
 * Agents must extract modules — not disable the fitness function.
 *
 *   pnpm check:modularity-disables
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");

/** Rules agents must not silence (eslint-disable / oxlint-disable). */
const BANNED =
  /(?:eslint|oxlint)-disable(?:-next-line|-line)?\s+[^\n]*(?:max-lines|max-lines-per-function|max-statements|max-depth|max-params|complexity|cyclomatic)/i;

/**
 * Rare, human-approved exceptions — path prefixes only.
 * Prefer deleting entries over growing this list.
 */
const ALLOWLIST_PREFIXES = [
  // none yet — add with human approval and a one-line reason in the commit
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".expo" || name === "build") {
      continue;
    }
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
      continue;
    }
    if (!/\.(?:[cm]?[jt]sx?|mjs|cjs)$/.test(name) || name.endsWith(".d.ts")) continue;
    const rel = relative(root, path).replaceAll("\\", "/");
    if (rel.includes("/generated/")) continue;
    out.push(rel);
  }
  return out;
}

const files = [
  ...walk(join(root, "apps")),
  ...walk(join(root, "packages")),
  ...walk(join(root, "scripts")),
];
const violations = [];

for (const file of files) {
  if (ALLOWLIST_PREFIXES.some((p) => file.startsWith(p))) continue;
  const lines = readFileSync(join(root, file), "utf8").split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    if (BANNED.test(lines[i])) {
      violations.push({ file, line: i + 1, excerpt: lines[i].trim().slice(0, 160) });
    }
  }
}

if (violations.length > 0) {
  console.error("Banned modularity lint disables:\n");
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line}`);
    console.error(`  ${v.excerpt}`);
    console.error("  Fix: extract a module; do not disable max-lines / complexity rules.\n");
  }
  process.exit(1);
}

console.log(`check:modularity-disables ok (${files.length} files)`);
