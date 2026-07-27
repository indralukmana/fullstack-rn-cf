/** Shared helpers for scripts/productize.mjs (kept testable without spawning). */

export const LAUNCHPAD_DEFAULTS = {
  name: "RN CF",
  slug: "rn-cf",
  scheme: "rncf",
  bundleId: "com.rncf.launchpad",
  apiWorker: "rn-cf-api",
  webPages: "rn-cf-web",
  docsPages: "rn-cf-docs",
  d1Name: "rn-cf",
  billingQueue: "rn-cf-billing-events",
  billingDlq: "rn-cf-billing-events-dlq",
  serviceName: "rn-cf-api",
};

export function slugifyName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function schemeFromSlug(slug) {
  const scheme = slug.replace(/-/g, "");
  if (!/^[a-z][a-z0-9]+$/.test(scheme)) {
    throw new Error(`Could not derive a valid Expo scheme from slug "${slug}"`);
  }
  return scheme;
}

export function bundleIdFromSlug(slug) {
  const leaf = slug.replace(/-/g, "");
  return `com.example.${leaf}`;
}

export function parseProductizeArgs(argv) {
  const out = {
    name: undefined,
    slug: undefined,
    scheme: undefined,
    bundleId: undefined,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") {
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      out.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (arg === "--name") {
      out.name = argv[++i];
      continue;
    }
    if (arg === "--slug") {
      out.slug = argv[++i];
      continue;
    }
    if (arg === "--scheme") {
      out.scheme = argv[++i];
      continue;
    }
    if (arg === "--bundle-id") {
      out.bundleId = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return out;
}

export function buildProductIdentity(args) {
  const name = args.name?.trim();
  const slug = (args.slug ?? slugifyName(name ?? "")).trim().toLowerCase();
  if (!name) {
    throw new Error("--name is required");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2) {
    throw new Error(`Invalid --slug "${slug}". Use lowercase letters, numbers, and hyphens.`);
  }

  const scheme = (args.scheme ?? schemeFromSlug(slug)).trim().toLowerCase();
  if (!/^[a-z][a-z0-9]+$/.test(scheme)) {
    throw new Error(
      `Invalid --scheme "${scheme}". Use lowercase letters/numbers, starting with a letter.`,
    );
  }

  const bundleId = (args.bundleId ?? bundleIdFromSlug(slug)).trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(bundleId)) {
    throw new Error(`Invalid --bundle-id "${bundleId}"`);
  }

  return {
    name,
    slug,
    scheme,
    bundleId,
    apiWorker: `${slug}-api`,
    webPages: `${slug}-web`,
    docsPages: `${slug}-docs`,
    d1Name: slug,
    billingQueue: `${slug}-billing-events`,
    billingDlq: `${slug}-billing-events-dlq`,
    serviceName: `${slug}-api`,
  };
}

/** Longest-first so compound tokens like rn-cf-billing-events replace before rn-cf. */
export function buildReplacements(identity) {
  const from = LAUNCHPAD_DEFAULTS;
  const pairs = [
    [from.billingDlq, identity.billingDlq],
    [from.billingQueue, identity.billingQueue],
    [from.apiWorker, identity.apiWorker],
    [from.webPages, identity.webPages],
    [from.docsPages, identity.docsPages],
    [from.serviceName, identity.serviceName],
    [from.bundleId, identity.bundleId],
    [`${from.scheme}://`, `${identity.scheme}://`],
    [from.slug, identity.slug],
    [from.d1Name, identity.d1Name],
    [from.scheme, identity.scheme],
    [from.name, identity.name],
  ];

  // Deduplicate identical from→to no-ops and identical from keys.
  const seen = new Set();
  const replacements = [];
  for (const [search, replace] of pairs) {
    if (search === replace) {
      continue;
    }
    if (seen.has(search)) {
      continue;
    }
    seen.add(search);
    replacements.push({ search, replace });
  }
  return replacements;
}

export function applyReplacements(source, replacements) {
  // Preserve npm workspace scope (@rn-cf/*) even when slug is rn-cf.
  const scopePlaceholder = "__LAUNCHPAD_NPM_SCOPE__";
  let next = source.split("@rn-cf").join(scopePlaceholder);
  for (const { search, replace } of replacements) {
    next = next.split(search).join(replace);
  }
  return next.split(scopePlaceholder).join("@rn-cf");
}
