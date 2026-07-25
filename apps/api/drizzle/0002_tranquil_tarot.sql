CREATE TABLE `billing_customer` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_customer_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "billing_customer_subject_type_check" CHECK("billing_customer"."subject_type" in ('user', 'organization')),
	CONSTRAINT "billing_customer_provider_check" CHECK("billing_customer"."provider" in ('stripe', 'revenuecat'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customer_provider_id_uidx` ON `billing_customer` (`provider`,`provider_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_customer_subject_provider_uidx` ON `billing_customer` (`subject_type`,`subject_id`,`provider`);--> statement-breakpoint
CREATE INDEX `billing_customer_subject_idx` ON `billing_customer` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE TABLE `billing_event` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload` text NOT NULL,
	`state` text DEFAULT 'received' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`received_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`processed_at` integer,
	CONSTRAINT "billing_event_provider_check" CHECK("billing_event"."provider" in ('stripe', 'revenuecat')),
	CONSTRAINT "billing_event_state_check" CHECK("billing_event"."state" in ('received', 'processing', 'processed', 'failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_event_provider_event_uidx` ON `billing_event` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `billing_event_state_received_idx` ON `billing_event` (`state`,`received_at`);--> statement-breakpoint
CREATE TABLE `entitlement` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`key` text NOT NULL,
	`status` text NOT NULL,
	`source` text NOT NULL,
	`source_subscription_id` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`source_subscription_id`) REFERENCES `subscription`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "entitlement_subject_type_check" CHECK("entitlement"."subject_type" in ('user', 'organization')),
	CONSTRAINT "entitlement_status_check" CHECK("entitlement"."status" in ('active', 'grace_period', 'revoked', 'expired')),
	CONSTRAINT "entitlement_source_check" CHECK("entitlement"."source" in ('stripe', 'revenuecat', 'manual'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlement_subject_key_uidx` ON `entitlement` (`subject_type`,`subject_id`,`key`);--> statement-breakpoint
CREATE INDEX `entitlement_subject_status_idx` ON `entitlement` (`subject_type`,`subject_id`,`status`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`billing_customer_id` text NOT NULL,
	`provider_subscription_id` text NOT NULL,
	`product_id` text NOT NULL,
	`price_id` text,
	`status` text NOT NULL,
	`current_period_ends_at` integer,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`billing_customer_id`) REFERENCES `billing_customer`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "subscription_status_check" CHECK("subscription"."status" in ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired', 'incomplete'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_customer_provider_id_uidx` ON `subscription` (`billing_customer_id`,`provider_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_customer_idx` ON `subscription` (`billing_customer_id`);--> statement-breakpoint
CREATE INDEX `subscription_status_idx` ON `subscription` (`status`);