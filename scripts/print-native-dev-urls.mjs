#!/usr/bin/env node
/**
 * Print-only helper: suggest API/app URLs for physical devices (Wi‑Fi LAN or Tailscale).
 * Does not write env files, start servers, or install apps — agents/humans adapt the recipe.
 *
 *   pnpm native:urls
 *   pnpm native:urls -- --prefer tailscale
 *   pnpm native:urls -- --prefer lan
 */
import { networkInterfaces } from "node:os";

function parseArgs(argv) {
  let prefer = "auto";
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--prefer") {
      prefer = argv[++i] ?? "auto";
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      return { help: true, prefer };
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { help: false, prefer };
}

function isTailscale(address) {
  return address.startsWith("100.");
}

function isPrivateLan(address) {
  if (address.startsWith("10.")) return true;
  if (address.startsWith("192.168.")) return true;
  const m = /^172\.(\d+)\./.exec(address);
  if (!m) return false;
  const second = Number(m[1]);
  return second >= 16 && second <= 31;
}

function collectAddresses() {
  const nets = networkInterfaces();
  const lan = [];
  const tailscale = [];
  for (const [name, entries] of Object.entries(nets)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.internal || entry.family !== "IPv4") continue;
      // Skip typical Docker/bridge noise when listing LAN candidates
      if (name.startsWith("br-") || name === "docker0" || name === "veth") continue;
      if (isTailscale(entry.address) || name.startsWith("tailscale")) {
        tailscale.push({ name, address: entry.address });
      } else if (isPrivateLan(entry.address)) {
        lan.push({ name, address: entry.address });
      }
    }
  }
  return { lan, tailscale };
}

function pickHost(prefer, lan, tailscale) {
  if (prefer === "tailscale") {
    return tailscale[0] ?? lan[0] ?? null;
  }
  if (prefer === "lan") {
    return lan[0] ?? tailscale[0] ?? null;
  }
  // auto: Tailscale if present (works across networks), else first LAN
  return tailscale[0] ?? lan[0] ?? null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:
  pnpm native:urls
  pnpm native:urls -- --prefer tailscale
  pnpm native:urls -- --prefer lan

Prints suggested EXPO_PUBLIC_* and CORS origin lines for a physical device.
Does not mutate the working tree.`);
    process.exit(0);
  }

  const { lan, tailscale } = collectAddresses();
  const picked = pickHost(args.prefer, lan, tailscale);

  console.log("Native device URL suggestions (print-only)\n");
  console.log("LAN candidates:");
  if (lan.length === 0) console.log("  (none)");
  else {
    for (const x of lan) console.log(`  ${x.address}  (${x.name})`);
  }
  console.log("Tailscale candidates:");
  if (tailscale.length === 0) console.log("  (none)");
  else {
    for (const x of tailscale) console.log(`  ${x.address}  (${x.name})`);
  }

  if (!picked) {
    console.log("\nNo usable IPv4 found. Connect Wi‑Fi or Tailscale, then re-run.");
    process.exit(1);
  }

  const host = picked.address;
  const api = `http://${host}:8787`;
  const app = `http://${host}:8081`;

  console.log(`\nSelected (${args.prefer}): ${host} via ${picked.name}`);
  console.log(`
Shell (current session only):
  export EXPO_PUBLIC_API_URL=${api}
  export EXPO_PUBLIC_APP_URL=${app}

API CORS — add to apps/api/.env.local (merge with existing origins, no trailing slash):
  CORS_ORIGINS=…,${app}

Start API bound for devices (not only loopback):
  pnpm dev:api:lan

Start Metro so the phone can reach the bundler:
  pnpm --filter @rn-cf/app exec expo start --lan --port 8081
  # or reuse: EXPO_PUBLIC_* above + pnpm dev:android (emulator still uses 10.0.2.2 unless you override)

Verify from the phone browser (optional):
  ${api}/health
  ${app}

Emulator reminder: keep http://10.0.2.2:8787 / :8081 — do not replace those with LAN/Tailscale
unless you intend to.
`);
}

main();
