import { eq } from "drizzle-orm";

import type { Auth, AuthEnv } from "../better-auth";

import { createDb } from "../../db/client";
import { entitlement, user } from "../../db/schema";
import { createAuth } from "../better-auth";
import { getBillingCatalog } from "../billing/catalog";

export const DEMO_PASSWORD = "demo-password-change-me";
export const DEMO_OWNER_EMAIL = "owner@example.com";
export const DEMO_MEMBER_EMAIL = "member@example.com";
export const DEMO_WORKSPACE_SLUG = "demo-workspace";

export type DemoSeedResult = {
  password: string;
  owner: { email: string; name: string; id: string };
  member: { email: string; name: string; id: string };
  workspace: { id: string; name: string; slug: string };
  created: {
    owner: boolean;
    member: boolean;
    workspace: boolean;
    membership: boolean;
    entitlement: boolean;
  };
};

async function ensureVerifiedUser(
  auth: Auth,
  env: AuthEnv,
  input: { email: string; name: string; password: string },
): Promise<{ user: { id: string; email: string; name: string }; created: boolean }> {
  const db = createDb(env.DB);
  const existing = await db.query.user.findFirst({ where: { email: input.email } });
  if (existing) {
    if (!existing.emailVerified) {
      await db.update(user).set({ emailVerified: true }).where(eq(user.id, existing.id));
    }
    return {
      user: { id: existing.id, email: existing.email, name: existing.name },
      created: false,
    };
  }

  await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
    },
  });

  const created = await db.query.user.findFirst({ where: { email: input.email } });
  if (!created) {
    throw new Error(`Failed to create demo user ${input.email}`);
  }
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, created.id));
  return {
    user: { id: created.id, email: created.email, name: created.name },
    created: true,
  };
}

export async function seedDemoData(env: AuthEnv): Promise<DemoSeedResult> {
  const auth = createAuth(env);
  const db = createDb(env.DB);

  const ownerResult = await ensureVerifiedUser(auth, env, {
    email: DEMO_OWNER_EMAIL,
    name: "Demo Owner",
    password: DEMO_PASSWORD,
  });
  const memberResult = await ensureVerifiedUser(auth, env, {
    email: DEMO_MEMBER_EMAIL,
    name: "Demo Member",
    password: DEMO_PASSWORD,
  });

  let workspace = await db.query.organization.findFirst({
    where: { slug: DEMO_WORKSPACE_SLUG },
  });
  let createdWorkspace = false;
  if (!workspace) {
    const created = await auth.api.createOrganization({
      body: {
        name: "Demo Workspace",
        slug: DEMO_WORKSPACE_SLUG,
        userId: ownerResult.user.id,
      },
    });
    workspace = await db.query.organization.findFirst({
      where: { slug: DEMO_WORKSPACE_SLUG },
    });
    if (!workspace) {
      throw new Error(
        `Failed to create demo workspace${created && typeof created === "object" ? "" : ""}`,
      );
    }
    createdWorkspace = true;
  }

  const existingMembership = await db.query.member.findFirst({
    where: {
      organizationId: workspace.id,
      userId: memberResult.user.id,
    },
  });
  let createdMembership = false;
  if (!existingMembership) {
    await auth.api.addMember({
      body: {
        userId: memberResult.user.id,
        role: "member",
        organizationId: workspace.id,
      },
    });
    createdMembership = true;
  }

  const catalog = getBillingCatalog(env);
  const existingEntitlement = await db.query.entitlement.findFirst({
    where: {
      subjectType: "organization",
      subjectId: workspace.id,
      key: catalog.entitlementKey,
    },
  });
  let createdEntitlement = false;
  if (!existingEntitlement) {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await db.insert(entitlement).values({
      id: crypto.randomUUID(),
      subjectType: "organization",
      subjectId: workspace.id,
      key: catalog.entitlementKey,
      status: "active",
      source: "manual",
      expiresAt,
      computedAt: new Date(),
    });
    createdEntitlement = true;
  }

  return {
    password: DEMO_PASSWORD,
    owner: ownerResult.user,
    member: memberResult.user,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    created: {
      owner: ownerResult.created,
      member: memberResult.created,
      workspace: createdWorkspace,
      membership: createdMembership,
      entitlement: createdEntitlement,
    },
  };
}
