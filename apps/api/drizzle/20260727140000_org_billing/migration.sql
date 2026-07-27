-- Organization-owned billing: purchase attempts keyed by organization; remap legacy user subjects.
ALTER TABLE `purchase_attempt` ADD `organization_id` text REFERENCES `organization`(`id`);
--> statement-breakpoint
UPDATE `purchase_attempt`
SET `organization_id` = (
  SELECT `member`.`organization_id`
  FROM `member`
  WHERE `member`.`user_id` = `purchase_attempt`.`user_id`
  ORDER BY `member`.`created_at` ASC
  LIMIT 1
)
WHERE `organization_id` IS NULL;
--> statement-breakpoint
DELETE FROM `purchase_attempt` WHERE `organization_id` IS NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS `purchase_attempt_pending_user_uidx`;
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_attempt_pending_org_uidx` ON `purchase_attempt` (`organization_id`) WHERE "purchase_attempt"."state" = 'pending';
--> statement-breakpoint
CREATE INDEX `purchase_attempt_org_state_idx` ON `purchase_attempt` (`organization_id`,`state`,`expires_at`);
--> statement-breakpoint
-- Remap provider customers from user → earliest personal organization membership.
UPDATE `billing_customer`
SET
  `subject_type` = 'organization',
  `subject_id` = (
    SELECT `member`.`organization_id`
    FROM `member`
    WHERE `member`.`user_id` = `billing_customer`.`subject_id`
    ORDER BY `member`.`created_at` ASC
    LIMIT 1
  )
WHERE `subject_type` = 'user'
  AND EXISTS (
    SELECT 1 FROM `member` WHERE `member`.`user_id` = `billing_customer`.`subject_id`
  );
--> statement-breakpoint
UPDATE `billing_customer`
SET `provider_customer_id` = `subject_id`
WHERE `provider` = 'revenuecat' AND `subject_type` = 'organization';
--> statement-breakpoint
UPDATE `provider_grant`
SET
  `subject_type` = 'organization',
  `subject_id` = (
    SELECT `member`.`organization_id`
    FROM `member`
    WHERE `member`.`user_id` = `provider_grant`.`subject_id`
    ORDER BY `member`.`created_at` ASC
    LIMIT 1
  )
WHERE `subject_type` = 'user'
  AND EXISTS (
    SELECT 1 FROM `member` WHERE `member`.`user_id` = `provider_grant`.`subject_id`
  );
--> statement-breakpoint
UPDATE `entitlement`
SET
  `subject_type` = 'organization',
  `subject_id` = (
    SELECT `member`.`organization_id`
    FROM `member`
    WHERE `member`.`user_id` = `entitlement`.`subject_id`
    ORDER BY `member`.`created_at` ASC
    LIMIT 1
  )
WHERE `subject_type` = 'user'
  AND EXISTS (
    SELECT 1 FROM `member` WHERE `member`.`user_id` = `entitlement`.`subject_id`
  );
