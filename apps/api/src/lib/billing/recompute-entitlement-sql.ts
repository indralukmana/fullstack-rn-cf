import { sql, type SQL } from "drizzle-orm";

import { entitlement } from "../../db/schema";

type GrantScope = {
  subjectType: "user" | "organization";
  subjectId: string;
  entitlementKey: string;
  providerEnvironment: "sandbox" | "production";
  nowMs: number;
};

function grantStatusCase(scope: GrantScope): SQL {
  const { subjectType, subjectId, entitlementKey, providerEnvironment, nowMs } = scope;
  return sql`
    case
      when exists (
        select 1 from provider_grant
        where subject_type = ${subjectType}
          and subject_id = ${subjectId}
          and entitlement_key = ${entitlementKey}
          and provider_environment = ${providerEnvironment}
          and status = 'active'
          and (expires_at is null or expires_at > ${nowMs})
      ) then 'active'
      when exists (
        select 1 from provider_grant
        where subject_type = ${subjectType}
          and subject_id = ${subjectId}
          and entitlement_key = ${entitlementKey}
          and provider_environment = ${providerEnvironment}
          and status = 'grace_period'
          and (expires_at is null or expires_at > ${nowMs})
      ) then 'grace_period'
      when exists (
        select 1 from provider_grant
        where subject_type = ${subjectType}
          and subject_id = ${subjectId}
          and entitlement_key = ${entitlementKey}
          and provider_environment = ${providerEnvironment}
      ) then 'expired'
      else 'revoked'
    end
  `;
}

function grantSourceExpression(scope: GrantScope): SQL {
  const { subjectType, subjectId, entitlementKey, providerEnvironment, nowMs } = scope;
  return sql`
    coalesce((
      select provider from provider_grant
      where subject_type = ${subjectType}
        and subject_id = ${subjectId}
        and entitlement_key = ${entitlementKey}
        and provider_environment = ${providerEnvironment}
        and status in ('active', 'grace_period')
        and (expires_at is null or expires_at > ${nowMs})
      order by case status when 'active' then 0 else 1 end, expires_at desc
      limit 1
    ), 'manual')
  `;
}

function grantExpiresExpression(scope: GrantScope): SQL {
  const { subjectType, subjectId, entitlementKey, providerEnvironment, nowMs } = scope;
  return sql`
    case
      when exists (
        select 1 from provider_grant
        where subject_type = ${subjectType}
          and subject_id = ${subjectId}
          and entitlement_key = ${entitlementKey}
          and provider_environment = ${providerEnvironment}
          and status in ('active', 'grace_period')
          and expires_at is null
      ) then null
      else (
        select max(expires_at) from provider_grant
        where subject_type = ${subjectType}
          and subject_id = ${subjectId}
          and entitlement_key = ${entitlementKey}
          and provider_environment = ${providerEnvironment}
          and status in ('active', 'grace_period')
          and expires_at > ${nowMs}
      )
    end
  `;
}

function preserveManualTrialCase(nowMs: number, whenProviderWins: SQL, whenManualWins: SQL): SQL {
  return sql`
    case
      when excluded.status in ('active', 'grace_period') then ${whenProviderWins}
      when ${entitlement.source} = 'manual'
        and ${entitlement.status} = 'active'
        and ${entitlement.expiresAt} is not null
        and ${entitlement.expiresAt} > ${nowMs}
      then ${whenManualWins}
      else ${whenProviderWins}
    end
  `;
}

/**
 * Atomic OR-projection of provider grants into the entitlement row.
 * Kept as one INSERT … SELECT so concurrent provider updates stay consistent.
 */
export function buildRecomputeEntitlementSql(scope: GrantScope): SQL {
  const { subjectType, subjectId, entitlementKey, nowMs } = scope;

  return sql`
    insert into ${entitlement} (
      id, subject_type, subject_id, key, status, source, source_subscription_id,
      expires_at, computed_at, created_at, updated_at
    )
    values (
      ${crypto.randomUUID()},
      ${subjectType},
      ${subjectId},
      ${entitlementKey},
      ${grantStatusCase(scope)},
      ${grantSourceExpression(scope)},
      null,
      ${grantExpiresExpression(scope)},
      ${nowMs},
      ${nowMs},
      ${nowMs}
    )
    on conflict(subject_type, subject_id, key) do update set
      status = ${preserveManualTrialCase(nowMs, sql`excluded.status`, sql`${entitlement.status}`)},
      source = ${preserveManualTrialCase(nowMs, sql`excluded.source`, sql`${entitlement.source}`)},
      source_subscription_id = ${preserveManualTrialCase(nowMs, sql`null`, sql`${entitlement.sourceSubscriptionId}`)},
      expires_at = ${preserveManualTrialCase(nowMs, sql`excluded.expires_at`, sql`${entitlement.expiresAt}`)},
      computed_at = excluded.computed_at,
      updated_at = excluded.updated_at
  `;
}
