import { sql } from "drizzle-orm";

import type { Database } from "../../db/client";

import { entitlement } from "../../db/schema";

type RecomputeEntitlementInput = {
  subjectType: "user" | "organization";
  subjectId: string;
  entitlementKey: string;
  providerEnvironment: "sandbox" | "production";
  now?: Date;
};

export async function recomputeEntitlement(
  db: Database,
  input: RecomputeEntitlementInput,
): Promise<void> {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  // A single INSERT ... SELECT statement makes the OR projection atomic even when providers
  // deliver duplicate or out-of-order updates concurrently.
  await db.run(sql`
    insert into ${entitlement} (
      id,
      subject_type,
      subject_id,
      key,
      status,
      source,
      source_subscription_id,
      expires_at,
      computed_at,
      created_at,
      updated_at
    )
    values (
      ${crypto.randomUUID()},
      ${input.subjectType},
      ${input.subjectId},
      ${input.entitlementKey},
      case
        when exists (
          select 1 from provider_grant
          where subject_type = ${input.subjectType}
            and subject_id = ${input.subjectId}
            and entitlement_key = ${input.entitlementKey}
            and provider_environment = ${input.providerEnvironment}
            and status = 'active'
            and (expires_at is null or expires_at > ${nowMs})
        ) then 'active'
        when exists (
          select 1 from provider_grant
          where subject_type = ${input.subjectType}
            and subject_id = ${input.subjectId}
            and entitlement_key = ${input.entitlementKey}
            and provider_environment = ${input.providerEnvironment}
            and status = 'grace_period'
            and (expires_at is null or expires_at > ${nowMs})
        ) then 'grace_period'
        when exists (
          select 1 from provider_grant
          where subject_type = ${input.subjectType}
            and subject_id = ${input.subjectId}
            and entitlement_key = ${input.entitlementKey}
            and provider_environment = ${input.providerEnvironment}
        ) then 'expired'
        else 'revoked'
      end,
      coalesce((
        select provider from provider_grant
        where subject_type = ${input.subjectType}
          and subject_id = ${input.subjectId}
          and entitlement_key = ${input.entitlementKey}
          and provider_environment = ${input.providerEnvironment}
          and status in ('active', 'grace_period')
          and (expires_at is null or expires_at > ${nowMs})
        order by case status when 'active' then 0 else 1 end, expires_at desc
        limit 1
      ), 'manual'),
      null,
      case
        when exists (
          select 1 from provider_grant
          where subject_type = ${input.subjectType}
            and subject_id = ${input.subjectId}
            and entitlement_key = ${input.entitlementKey}
            and provider_environment = ${input.providerEnvironment}
            and status in ('active', 'grace_period')
            and expires_at is null
        ) then null
        else (
          select max(expires_at) from provider_grant
          where subject_type = ${input.subjectType}
            and subject_id = ${input.subjectId}
            and entitlement_key = ${input.entitlementKey}
            and provider_environment = ${input.providerEnvironment}
            and status in ('active', 'grace_period')
            and expires_at > ${nowMs}
        )
      end,
      ${nowMs},
      ${nowMs},
      ${nowMs}
    )
    on conflict(subject_type, subject_id, key) do update set
      status = case
        when excluded.status in ('active', 'grace_period') then excluded.status
        when ${entitlement.source} = 'manual'
          and ${entitlement.status} = 'active'
          and ${entitlement.expiresAt} is not null
          and ${entitlement.expiresAt} > ${nowMs}
        then ${entitlement.status}
        else excluded.status
      end,
      source = case
        when excluded.status in ('active', 'grace_period') then excluded.source
        when ${entitlement.source} = 'manual'
          and ${entitlement.status} = 'active'
          and ${entitlement.expiresAt} is not null
          and ${entitlement.expiresAt} > ${nowMs}
        then ${entitlement.source}
        else excluded.source
      end,
      source_subscription_id = case
        when excluded.status in ('active', 'grace_period') then null
        when ${entitlement.source} = 'manual'
          and ${entitlement.status} = 'active'
          and ${entitlement.expiresAt} is not null
          and ${entitlement.expiresAt} > ${nowMs}
        then ${entitlement.sourceSubscriptionId}
        else null
      end,
      expires_at = case
        when excluded.status in ('active', 'grace_period') then excluded.expires_at
        when ${entitlement.source} = 'manual'
          and ${entitlement.status} = 'active'
          and ${entitlement.expiresAt} is not null
          and ${entitlement.expiresAt} > ${nowMs}
        then ${entitlement.expiresAt}
        else excluded.expires_at
      end,
      computed_at = excluded.computed_at,
      updated_at = excluded.updated_at
  `);
}
