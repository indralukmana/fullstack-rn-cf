CREATE TABLE `billing_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`subject_user_id` text NOT NULL,
	`action` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "billing_audit_action_check" CHECK("billing_audit"."action" in ('reconciliation_requested', 'account_exported', 'account_deletion_blocked', 'account_deleted'))
);
--> statement-breakpoint
CREATE INDEX `billing_audit_subject_created_idx` ON `billing_audit` (`subject_user_id`,`created_at`);