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
  return `import {
  useCreateFeatureItem,
  useListFeatureItems,
  getListFeatureItemsQueryKey,
} from "@rn-cf/api-client";
import { useState } from "react";
import { View } from "react-native";

import {
  BodyText,
  Button,
  EmptyState,
  Field,
  LoadingScreen,
  QueryError,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  Section,
  StatusText,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

const FEATURE_KEY = "${featureKey}";

export default function ${title.replace(/[^a-zA-Z0-9]/g, "")}Screen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const activeOrganization = authClient.useActiveOrganization();
  const listQuery = useListFeatureItems(FEATURE_KEY, {
    query: {
      queryKey: getListFeatureItemsQueryKey(FEATURE_KEY),
      enabled: Boolean(session?.user && activeOrganization.data?.id),
    },
  });
  const createMutation = useCreateFeatureItem();
  const [titleValue, setTitleValue] = useState("");
  const [bodyValue, setBodyValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (sessionPending || activeOrganization.isPending) {
    return <LoadingScreen label="Loading…" />;
  }

  if (!session?.user) {
    return (
      <Screen centered>
        <ScreenTitle>${title}</ScreenTitle>
        <ScreenLead>Sign in to manage ${title.toLowerCase()} for your active organization.</ScreenLead>
        <QuietLink href="/sign-in">Sign in</QuietLink>
      </Screen>
    );
  }

  if (!activeOrganization.data) {
    return (
      <Screen centered>
        <ScreenTitle>${title}</ScreenTitle>
        <ScreenLead>Select an active organization first.</ScreenLead>
        <QuietLink href="/organizations">Organizations</QuietLink>
      </Screen>
    );
  }

  const items =
    listQuery.data?.data && "items" in listQuery.data.data ? listQuery.data.data.items : [];

  async function onCreate() {
    const titleText = titleValue.trim();
    if (!titleText) {
      setError("Title is required.");
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        featureKey: FEATURE_KEY,
        data: { title: titleText, body: bodyValue.trim() || undefined },
      });
      setTitleValue("");
      setBodyValue("");
      await listQuery.refetch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create item.");
    }
  }

  return (
    <Screen scroll>
      <ScreenTitle>${title}</ScreenTitle>
      <ScreenLead>
        Org-scoped ${title.toLowerCase()} for {activeOrganization.data.name}. Backed by{" "}
        {\`/api/features/\${FEATURE_KEY}/items\`}.
      </ScreenLead>

      <Section title="Items">
        {listQuery.isError ? (
          <QueryError message="Could not load items." onRetry={() => void listQuery.refetch()} />
        ) : listQuery.isPending ? (
          <BodyText className="text-base text-foreground-secondary">Loading…</BodyText>
        ) : items.length ? (
          <View className="gap-2">
            {items.map((item) => (
              <View key={item.id} className="rounded-lg border border-border bg-elevated px-4 py-3">
                <BodyText className="text-foreground" weight="semibold">
                  {item.title}
                </BodyText>
                {item.body ? (
                  <BodyText className="text-sm text-foreground-muted">{item.body}</BodyText>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No items yet"
            description="Create the first ${title.toLowerCase()} item for this organization."
          />
        )}
      </Section>

      <Section title="Create">
        <View className="gap-3">
          <Field label="Title" onChangeText={setTitleValue} value={titleValue} placeholder="Title" />
          <Field
            label="Body"
            onChangeText={setBodyValue}
            value={bodyValue}
            placeholder="Optional details"
          />
          <Button
            disabled={createMutation.isPending}
            label={createMutation.isPending ? "Saving…" : "Create"}
            onPress={() => void onCreate()}
          />
          {error ? <StatusText>{error}</StatusText> : null}
        </View>
      </Section>

      <QuietLink href="/me">Back to account</QuietLink>
    </Screen>
  );
}
`;
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
  const mePath = join(root, "apps/app/app/me.tsx");
  let source = readFileSync(mePath, "utf8");
  if (source.includes(`href="./${name}"`)) {
    return { path: mePath, changed: false };
  }
  const anchor = `<Link href="./organizations" asChild>`;
  if (!source.includes(anchor)) {
    throw new Error(`Could not find organizations Account link anchor in ${mePath}`);
  }
  const insertion = `<Link href="./${name}" asChild>
              <Button label="${title}" variant="secondary" />
            </Link>
            ${anchor}`;
  source = source.replace(anchor, insertion);
  writeFileSync(mePath, source);
  return { path: mePath, changed: true };
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
Wires Stack.Screen in _layout.tsx and an Account link in me.tsx when missing.`);
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
