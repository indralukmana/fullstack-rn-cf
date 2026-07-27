import type { Database } from "../../db/client";

import { buildRecomputeEntitlementSql } from "./recompute-entitlement-sql";

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
  await db.run(
    buildRecomputeEntitlementSql({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      entitlementKey: input.entitlementKey,
      providerEnvironment: input.providerEnvironment,
      nowMs: now.getTime(),
    }),
  );
}
