import { describe, expect, it } from "vitest";

import { getApi, postApi } from "../helpers/api-request";
import { getMailbox, signUpVerifiedUser } from "../helpers/email-auth";

describe("organization integration", () => {
  it("requires authentication to list organizations", async () => {
    const response = await getApi("/api/auth/organization/list");

    expect(response.status).toBe(401);
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
    await expect(listed.json()).resolves.toEqual([
      expect.objectContaining({
        name: "Acme Company",
        slug: `acme-${suffix}`,
      }),
    ]);

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
});
