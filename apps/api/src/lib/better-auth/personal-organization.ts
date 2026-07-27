import { eq } from "drizzle-orm";

import type { Database } from "../../db/client";

import { member } from "../../db/schema";

export function personalOrganizationName(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) {
    return "Personal organization";
  }
  return `${trimmed}'s organization`;
}

export function personalOrganizationSlug(user: { id: string; name: string }): string {
  const base =
    user.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user";
  const suffix =
    user.id
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase()
      .slice(0, 16) || "org";
  return `${base}-${suffix}`.slice(0, 48);
}

export type CreateOrganizationFn = (input: {
  body: { name: string; slug: string; userId: string };
}) => Promise<unknown>;

export async function ensurePersonalOrganization(
  createOrganization: CreateOrganizationFn,
  db: Database,
  user: { id: string; name: string },
): Promise<void> {
  const existing = await db.query.member.findFirst({
    where: { userId: user.id },
  });
  if (existing) {
    return;
  }

  await createOrganization({
    body: {
      name: personalOrganizationName(user.name),
      slug: personalOrganizationSlug(user),
      userId: user.id,
    },
  });
}

export async function resolveDefaultActiveOrganizationId(
  db: Database,
  userId: string,
): Promise<string | undefined> {
  const membership = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .orderBy(member.createdAt)
    .get();

  return membership?.organizationId;
}
