import type { Database } from "../../db/client";

export type EntitlementSubjectType = "user" | "organization";

/**
 * Look up a currently usable entitlement row for a billing subject.
 * Launchpad billing projects onto Organization (ADR 0001).
 */
export async function findActiveEntitlement(
  db: Database,
  input: {
    subjectType: EntitlementSubjectType;
    subjectId: string;
    key: string;
  },
) {
  return db.query.entitlement.findFirst({
    where: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      key: input.key,
      status: { in: ["active", "grace_period"] },
      OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gt: new Date() } }],
    },
    columns: {
      id: true,
      status: true,
      key: true,
      subjectType: true,
      subjectId: true,
    },
  });
}

export async function subjectHasEntitlement(
  db: Database,
  input: {
    subjectType: EntitlementSubjectType;
    subjectId: string;
    key: string;
  },
): Promise<boolean> {
  const row = await findActiveEntitlement(db, input);
  return Boolean(row);
}
