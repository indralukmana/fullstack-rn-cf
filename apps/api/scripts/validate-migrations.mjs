import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(apiRoot, "drizzle");
const migrations = readdirSync(migrationsDir)
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .toSorted();
const db = new Database(":memory:");
db.pragma("foreign_keys = ON");

try {
  for (const migration of migrations) {
    const statements = readFileSync(join(migrationsDir, migration), "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    try {
      for (const statement of statements) {
        db.exec(statement);
      }
    } catch (error) {
      throw new Error(`Migration ${migration} failed: ${error.message}`, { cause: error });
    }
  }

  const integrity = db.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") {
    throw new Error(`SQLite integrity check failed: ${String(integrity)}`);
  }
  const foreignKeyFailures = db.pragma("foreign_key_check");
  if (foreignKeyFailures.length > 0) {
    throw new Error(`Foreign key check failed: ${JSON.stringify(foreignKeyFailures)}`);
  }
  process.stdout.write(`Validated ${migrations.length} D1 migrations on a fresh database.\n`);
} finally {
  db.close();
}
