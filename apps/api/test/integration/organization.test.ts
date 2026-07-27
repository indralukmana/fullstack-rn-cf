import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { member as memberTable } from "../../src/db/schema";
import { getApi, postApi } from "../helpers/api-request";
import { getMailbox, signUpVerifiedUser } from "../helpers/email-auth";

describe("organization integration", () => {
  it("requires authentication to list organizations", async () => {
    const response = await getApi("/api/auth/organization/list");

    expect(response.status).toBe(401);
  });

  it("creates a personal organization on signup and activates it on session", async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID()}`;
    const account = await signUpVerifiedUser({
      email: `personal-${suffix}@example.com`,
      name: "Personal Owner",
    });

    const listed = await getApi("/api/auth/organization/list", account.cookie);
    expect(listed.status).toBe(200);
    const organizations = (await listed.json()) as Array<{
      name: string;
      slug: string;
      id: string;
    }>;
    expect(organizations).toHaveLength(1);
    expect(organizations[0]).toMatchObject({
      name: "Personal Owner's organization",
    });

    const session = await getApi("/api/auth/get-session", account.cookie);
    expect(session.status).toBe(200);
    const sessionBody = (await session.json()) as {
      session: { activeOrganizationId: string | null };
    };
    expect(sessionBody.session.activeOrganizationId).toBe(organizations[0]?.id);
  });

  it("creates an organization and owner membership for a verified user", async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID()}`;
    const account = await signUpVerifiedUser({
      email: `owner-${suffix}@example.com`,
      name: "Organization Owner",
    });

    expect(account.cookie).toBeTruthy();

    const created = await postApi(
      "/api/auth/organization/create",
      {
        name: "Acme Company",
        slug: `acme-${suffix}`,
      },
      account.cookie,
    );

    expect(created.status).toBe(200);
    const createdOrganization = (await created.json()) as {
      id: string;
      name: string;
      slug: string;
      members: Array<{ role: string; userId: string }>;
    };
    expect(createdOrganization).toMatchObject({
      name: "Acme Company",
      slug: `acme-${suffix}`,
      members: [
        {
          role: "owner",
          userId: expect.any(String),
        },
      ],
    });

    const invitedEmail = `member-${suffix}@example.com`;
    const invited = await postApi(
      "/api/auth/organization/invite-member",
      {
        email: invitedEmail,
        role: "member",
        organizationId: createdOrganization.id,
      },
      account.cookie,
    );
    expect(invited.status).toBe(200);

    const mailbox = await getMailbox(invitedEmail);
    expect(mailbox.messages).toEqual([
      expect.objectContaining({
        subject: "Join Acme Company",
        text: expect.stringContaining("http://127.0.0.1:8081/accept-invitation?id="),
      }),
    ]);

    const listed = await getApi("/api/auth/organization/list", account.cookie);
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Organization Owner's organization",
        }),
        expect.objectContaining({
          name: "Acme Company",
          slug: `acme-${suffix}`,
        }),
      ]),
    );

    const context = await getApi("/api/private/organization", account.cookie, {
      "X-Organization-Id": createdOrganization.id,
    });
    expect(context.status).toBe(200);
    await expect(context.json()).resolves.toEqual({
      organization: {
        id: createdOrganization.id,
        role: "owner",
      },
    });

    const otherAccount = await signUpVerifiedUser({
      email: `other-owner-${suffix}@example.com`,
      name: "Other Owner",
    });
    const otherCreated = await postApi(
      "/api/auth/organization/create",
      {
        name: "Other Company",
        slug: `other-${suffix}`,
      },
      otherAccount.cookie,
    );
    expect(otherCreated.status).toBe(200);
    const otherOrganization = (await otherCreated.json()) as { id: string };

    const crossTenant = await getApi("/api/private/organization", account.cookie, {
      "X-Organization-Id": otherOrganization.id,
    });
    expect(crossTenant.status).toBe(403);
    await expect(crossTenant.json()).resolves.toMatchObject({
      error: "forbidden",
    });
  });

  it("transfers ownership so the previous sole owner can leave", async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID()}`;
    const owner = await signUpVerifiedUser({
      email: `transfer-owner-${suffix}@example.com`,
      name: "Transfer Owner",
    });
    const member = await signUpVerifiedUser({
      email: `transfer-member-${suffix}@example.com`,
      name: "Transfer Member",
    });

    const orgs = (await (
      await getApi("/api/auth/organization/list", owner.cookie)
    ).json()) as Array<{
      id: string;
    }>;
    const organizationId = orgs[0]?.id;
    if (!organizationId) {
      throw new Error("missing personal organization");
    }

    const db = createDb(env.DB);
    const memberUser = await db.query.user.findFirst({ where: { email: member.email } });
    const ownerUser = await db.query.user.findFirst({ where: { email: owner.email } });
    if (!memberUser || !ownerUser) {
      throw new Error("missing users for ownership transfer");
    }
    await db.insert(memberTable).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: memberUser.id,
      role: "member",
      createdAt: new Date(),
    });

    const ownerMembership = await db.query.member.findFirst({
      where: {
        organizationId,
        userId: ownerUser.id,
      },
    });
    const memberMembership = await db.query.member.findFirst({
      where: { organizationId, userId: memberUser.id },
    });
    if (!ownerMembership?.id || !memberMembership?.id) {
      throw new Error("missing memberships for ownership transfer");
    }

    const promoted = await postApi(
      "/api/auth/organization/update-member-role",
      { memberId: memberMembership.id, role: "owner", organizationId },
      owner.cookie,
    );
    expect(promoted.status).toBe(200);

    const demoted = await postApi(
      "/api/auth/organization/update-member-role",
      { memberId: ownerMembership.id, role: "admin", organizationId },
      owner.cookie,
    );
    expect(demoted.status).toBe(200);

    const left = await postApi("/api/auth/organization/leave", { organizationId }, owner.cookie);
    expect(left.status).toBe(200);
  });
});
