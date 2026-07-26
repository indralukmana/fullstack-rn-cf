import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Discover Drizzle Kit v1 nested migrations (`<folder>/migration.sql`) in the
 * same relative-name form Wrangler records when `migrations_pattern` is set.
 */
export function listNestedMigrationFiles(migrationsDir) {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      try {
        return readdirSync(join(migrationsDir, name)).includes("migration.sql");
      } catch {
        return false;
      }
    })
    .toSorted()
    .map((name) => ({
      name: `${name}/migration.sql`,
      path: join(migrationsDir, name, "migration.sql"),
    }));
}

export async function readNestedD1Migrations(migrationsDir) {
  const { unstable_splitSqlQuery } = await import("wrangler");
  return listNestedMigrationFiles(migrationsDir).map(({ name, path }) => ({
    name,
    queries: unstable_splitSqlQuery(readFileSync(path, "utf8")),
  }));
}
