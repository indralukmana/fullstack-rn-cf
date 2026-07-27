CREATE TABLE `feature_item` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`feature_key` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`created_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feature_item_org_key_created_idx` ON `feature_item` (`organization_id`,`feature_key`,`created_at`);
