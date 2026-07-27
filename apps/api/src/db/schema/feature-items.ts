import { sql } from "drizzle-orm";
import { index, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

import { organization, user } from "./auth";

/**
 * Generic org-scoped rows for product feature modules.
 * scaffold-feature screens use a stable featureKey (e.g. "notes") against this table.
 */
export const featureItem = sqliteTable(
  "feature_item",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("feature_item_org_key_created_idx").on(
      table.organizationId,
      table.featureKey,
      table.createdAt,
    ),
  ],
);
