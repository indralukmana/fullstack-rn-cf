import { relations, sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const billingCustomer = sqliteTable(
  "billing_customer",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type", { enum: ["user", "organization"] }).notNull(),
    subjectId: text("subject_id").notNull(),
    provider: text("provider", { enum: ["stripe", "revenuecat"] }).notNull(),
    providerCustomerId: text("provider_customer_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("billing_customer_provider_id_uidx").on(table.provider, table.providerCustomerId),
    uniqueIndex("billing_customer_subject_provider_uidx").on(
      table.subjectType,
      table.subjectId,
      table.provider,
    ),
    index("billing_customer_subject_idx").on(table.subjectType, table.subjectId),
    check(
      "billing_customer_subject_type_check",
      sql`${table.subjectType} in ('user', 'organization')`,
    ),
    check("billing_customer_provider_check", sql`${table.provider} in ('stripe', 'revenuecat')`),
  ],
);

export const subscription = sqliteTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    billingCustomerId: text("billing_customer_id")
      .notNull()
      .references(() => billingCustomer.id, { onDelete: "cascade" }),
    providerSubscriptionId: text("provider_subscription_id").notNull(),
    providerEnvironment: text("provider_environment", {
      enum: ["sandbox", "production"],
    }).default("production"),
    productId: text("product_id").notNull(),
    priceId: text("price_id"),
    interval: text("interval", { enum: ["monthly", "yearly"] }),
    status: text("status", {
      enum: ["trialing", "active", "past_due", "paused", "canceled", "expired", "incomplete"],
    }).notNull(),
    currentPeriodEndsAt: integer("current_period_ends_at", { mode: "timestamp_ms" }),
    managementUrl: text("management_url"),
    lastProviderState: text("last_provider_state"),
    lastAppliedAt: integer("last_applied_at", { mode: "timestamp_ms" }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("subscription_customer_provider_id_uidx").on(
      table.billingCustomerId,
      table.providerSubscriptionId,
    ),
    index("subscription_customer_idx").on(table.billingCustomerId),
    index("subscription_status_idx").on(table.status),
    check(
      "subscription_status_check",
      sql`${table.status} in ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'incomplete')`,
    ),
    check(
      "subscription_environment_check",
      sql`${table.providerEnvironment} is null or ${table.providerEnvironment} in ('sandbox', 'production')`,
    ),
    check(
      "subscription_interval_check",
      sql`${table.interval} is null or ${table.interval} in ('monthly', 'yearly')`,
    ),
  ],
);

export const billingEvent = sqliteTable(
  "billing_event",
  {
    id: text("id").primaryKey(),
    provider: text("provider", { enum: ["stripe", "revenuecat"] }).notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    providerEnvironment: text("provider_environment", {
      enum: ["sandbox", "production"],
    }),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }),
    payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    state: text("state", { enum: ["received", "processing", "processed", "failed"] })
      .default("received")
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    receivedAt: integer("received_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("billing_event_provider_event_uidx").on(table.provider, table.providerEventId),
    index("billing_event_state_received_idx").on(table.state, table.receivedAt),
    check("billing_event_provider_check", sql`${table.provider} in ('stripe', 'revenuecat')`),
    check(
      "billing_event_environment_check",
      sql`${table.providerEnvironment} is null or ${table.providerEnvironment} in ('sandbox', 'production')`,
    ),
    check(
      "billing_event_state_check",
      sql`${table.state} in ('received', 'processing', 'processed', 'failed')`,
    ),
  ],
);

export const entitlement = sqliteTable(
  "entitlement",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type", { enum: ["user", "organization"] }).notNull(),
    subjectId: text("subject_id").notNull(),
    key: text("key").notNull(),
    status: text("status", { enum: ["active", "grace_period", "revoked", "expired"] }).notNull(),
    source: text("source", { enum: ["stripe", "revenuecat", "manual"] }).notNull(),
    sourceSubscriptionId: text("source_subscription_id").references(() => subscription.id, {
      onDelete: "set null",
    }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    computedAt: integer("computed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("entitlement_subject_key_uidx").on(table.subjectType, table.subjectId, table.key),
    index("entitlement_subject_status_idx").on(table.subjectType, table.subjectId, table.status),
    check("entitlement_subject_type_check", sql`${table.subjectType} in ('user', 'organization')`),
    check(
      "entitlement_status_check",
      sql`${table.status} in ('active', 'grace_period', 'revoked', 'expired')`,
    ),
    check("entitlement_source_check", sql`${table.source} in ('stripe', 'revenuecat', 'manual')`),
  ],
);

export const providerGrant = sqliteTable(
  "provider_grant",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type", { enum: ["user", "organization"] }).notNull(),
    subjectId: text("subject_id").notNull(),
    entitlementKey: text("entitlement_key").notNull(),
    provider: text("provider", { enum: ["stripe", "revenuecat"] }).notNull(),
    providerEnvironment: text("provider_environment", {
      enum: ["sandbox", "production"],
    }).notNull(),
    providerGrantId: text("provider_grant_id").notNull(),
    billingCustomerId: text("billing_customer_id").references(() => billingCustomer.id, {
      onDelete: "set null",
    }),
    subscriptionId: text("subscription_id").references(() => subscription.id, {
      onDelete: "set null",
    }),
    productId: text("product_id").notNull(),
    interval: text("interval", { enum: ["monthly", "yearly"] }).notNull(),
    status: text("status", {
      enum: ["active", "grace_period", "revoked", "expired"],
    }).notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    managementUrl: text("management_url"),
    lastProviderState: text("last_provider_state").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("provider_grant_provider_id_uidx").on(
      table.provider,
      table.providerEnvironment,
      table.providerGrantId,
      table.entitlementKey,
    ),
    index("provider_grant_subject_status_idx").on(
      table.subjectType,
      table.subjectId,
      table.entitlementKey,
      table.status,
    ),
    index("provider_grant_subscription_idx").on(table.subscriptionId),
    check("provider_grant_provider_check", sql`${table.provider} in ('stripe', 'revenuecat')`),
    check(
      "provider_grant_environment_check",
      sql`${table.providerEnvironment} in ('sandbox', 'production')`,
    ),
    check("provider_grant_interval_check", sql`${table.interval} in ('monthly', 'yearly')`),
    check(
      "provider_grant_status_check",
      sql`${table.status} in ('active', 'grace_period', 'revoked', 'expired')`,
    ),
  ],
);

export const purchaseAttempt = sqliteTable(
  "purchase_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    provider: text("provider", { enum: ["stripe", "revenuecat"] }).notNull(),
    providerEnvironment: text("provider_environment", {
      enum: ["sandbox", "production"],
    }).notNull(),
    interval: text("interval", { enum: ["monthly", "yearly"] }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    providerSessionId: text("provider_session_id"),
    state: text("state", {
      enum: ["pending", "completed", "failed", "expired"],
    })
      .default("pending")
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("purchase_attempt_idempotency_uidx").on(table.idempotencyKey),
    uniqueIndex("purchase_attempt_provider_session_uidx").on(
      table.provider,
      table.providerSessionId,
    ),
    index("purchase_attempt_user_state_idx").on(table.userId, table.state, table.expiresAt),
    check("purchase_attempt_provider_check", sql`${table.provider} in ('stripe', 'revenuecat')`),
    check(
      "purchase_attempt_environment_check",
      sql`${table.providerEnvironment} in ('sandbox', 'production')`,
    ),
    check("purchase_attempt_interval_check", sql`${table.interval} in ('monthly', 'yearly')`),
    check(
      "purchase_attempt_state_check",
      sql`${table.state} in ('pending', 'completed', 'failed', 'expired')`,
    ),
  ],
);

export const billingCustomerRelations = relations(billingCustomer, ({ many }) => ({
  subscriptions: many(subscription),
}));

export const subscriptionRelations = relations(subscription, ({ one, many }) => ({
  customer: one(billingCustomer, {
    fields: [subscription.billingCustomerId],
    references: [billingCustomer.id],
  }),
  entitlements: many(entitlement),
  grants: many(providerGrant),
}));

export const entitlementRelations = relations(entitlement, ({ one }) => ({
  subscription: one(subscription, {
    fields: [entitlement.sourceSubscriptionId],
    references: [subscription.id],
  }),
}));

export const providerGrantRelations = relations(providerGrant, ({ one }) => ({
  customer: one(billingCustomer, {
    fields: [providerGrant.billingCustomerId],
    references: [billingCustomer.id],
  }),
  subscription: one(subscription, {
    fields: [providerGrant.subscriptionId],
    references: [subscription.id],
  }),
}));
