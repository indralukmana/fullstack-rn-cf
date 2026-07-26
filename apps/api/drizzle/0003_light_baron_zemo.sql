CREATE TABLE `provider_grant` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`entitlement_key` text NOT NULL,
	`provider` text NOT NULL,
	`provider_environment` text NOT NULL,
	`provider_grant_id` text NOT NULL,
	`billing_customer_id` text,
	`subscription_id` text,
	`product_id` text NOT NULL,
	`interval` text NOT NULL,
	`status` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`expires_at` integer,
	`management_url` text,
	`last_provider_state` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`billing_customer_id`) REFERENCES `billing_customer`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscription`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "provider_grant_provider_check" CHECK("provider_grant"."provider" in ('stripe', 'revenuecat')),
	CONSTRAINT "provider_grant_environment_check" CHECK("provider_grant"."provider_environment" in ('sandbox', 'production')),
	CONSTRAINT "provider_grant_interval_check" CHECK("provider_grant"."interval" in ('monthly', 'yearly')),
	CONSTRAINT "provider_grant_status_check" CHECK("provider_grant"."status" in ('active', 'grace_period', 'revoked', 'expired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_grant_provider_id_uidx` ON `provider_grant` (`provider`,`provider_environment`,`provider_grant_id`,`entitlement_key`);--> statement-breakpoint
CREATE INDEX `provider_grant_subject_status_idx` ON `provider_grant` (`subject_type`,`subject_id`,`entitlement_key`,`status`);--> statement-breakpoint
CREATE INDEX `provider_grant_subscription_idx` ON `provider_grant` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `purchase_attempt` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_environment` text NOT NULL,
	`interval` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`provider_session_id` text,
	`state` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "purchase_attempt_provider_check" CHECK("purchase_attempt"."provider" in ('stripe', 'revenuecat')),
	CONSTRAINT "purchase_attempt_environment_check" CHECK("purchase_attempt"."provider_environment" in ('sandbox', 'production')),
	CONSTRAINT "purchase_attempt_interval_check" CHECK("purchase_attempt"."interval" in ('monthly', 'yearly')),
	CONSTRAINT "purchase_attempt_state_check" CHECK("purchase_attempt"."state" in ('pending', 'completed', 'failed', 'expired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_attempt_idempotency_uidx` ON `purchase_attempt` (`idempotency_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_attempt_provider_session_uidx` ON `purchase_attempt` (`provider`,`provider_session_id`);--> statement-breakpoint
CREATE INDEX `purchase_attempt_user_state_idx` ON `purchase_attempt` (`user_id`,`state`,`expires_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_billing_event` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`provider_environment` text,
	`occurred_at` integer,
	`payload` text NOT NULL,
	`state` text DEFAULT 'received' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`received_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`processed_at` integer,
	CONSTRAINT "billing_event_provider_check" CHECK("__new_billing_event"."provider" in ('stripe', 'revenuecat')),
	CONSTRAINT "billing_event_environment_check" CHECK("__new_billing_event"."provider_environment" is null or "__new_billing_event"."provider_environment" in ('sandbox', 'production')),
	CONSTRAINT "billing_event_state_check" CHECK("__new_billing_event"."state" in ('received', 'processing', 'processed', 'failed'))
);
--> statement-breakpoint
INSERT INTO `__new_billing_event`("id", "provider", "provider_event_id", "event_type", "payload", "state", "attempts", "last_error", "received_at", "processed_at") SELECT "id", "provider", "provider_event_id", "event_type", "payload", "state", "attempts", "last_error", "received_at", "processed_at" FROM `billing_event`;--> statement-breakpoint
DROP TABLE `billing_event`;--> statement-breakpoint
ALTER TABLE `__new_billing_event` RENAME TO `billing_event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `billing_event_provider_event_uidx` ON `billing_event` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `billing_event_state_received_idx` ON `billing_event` (`state`,`received_at`);--> statement-breakpoint
ALTER TABLE `entitlement` ADD `computed_at` integer;--> statement-breakpoint
CREATE TABLE `__new_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_customer_id` text NOT NULL,
	`provider_subscription_id` text NOT NULL,
	`provider_environment` text DEFAULT 'production',
	`product_id` text NOT NULL,
	`price_id` text,
	`interval` text,
	`status` text NOT NULL,
	`current_period_ends_at` integer,
	`management_url` text,
	`last_provider_state` text,
	`last_applied_at` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`billing_customer_id`) REFERENCES `billing_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "subscription_status_check" CHECK("__new_subscription"."status" in ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'incomplete')),
	CONSTRAINT "subscription_environment_check" CHECK("__new_subscription"."provider_environment" is null or "__new_subscription"."provider_environment" in ('sandbox', 'production')),
	CONSTRAINT "subscription_interval_check" CHECK("__new_subscription"."interval" is null or "__new_subscription"."interval" in ('monthly', 'yearly'))
);
--> statement-breakpoint
INSERT INTO `__new_subscription`("id", "billing_customer_id", "provider_subscription_id", "product_id", "price_id", "status", "current_period_ends_at", "cancel_at_period_end", "created_at", "updated_at") SELECT "id", "billing_customer_id", "provider_subscription_id", "product_id", "price_id", "status", "current_period_ends_at", "cancel_at_period_end", "created_at", "updated_at" FROM `subscription`;--> statement-breakpoint
DROP TABLE `subscription`;--> statement-breakpoint
ALTER TABLE `__new_subscription` RENAME TO `subscription`;--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_customer_provider_id_uidx` ON `subscription` (`billing_customer_id`,`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_customer_idx` ON `subscription` (`billing_customer_id`);--> statement-breakpoint
CREATE INDEX `subscription_status_idx` ON `subscription` (`status`);