import { expect, test } from "@playwright/test";

import { getMailbox, registerViaUi, uniqueEmail } from "./helpers/auth";

test("rejects an incomplete organization invitation link", async ({ page }) => {
  await page.goto("/accept-invitation");

  await expect(page.getByRole("heading", { name: "Organization invitation" })).toBeVisible();
  await expect(page.getByText("This invitation link is incomplete")).toBeVisible();
});

test("returns signed-out invitees to the invitation after sign-in", async ({ page }) => {
  await page.goto("/accept-invitation?id=invitation-test-id");
  await page.getByRole("link", { name: "Sign in to continue" }).click();

  await expect(page).toHaveURL(/\/sign-in\?.*returnTo=/);
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
});

test("accepts an organization invitation as a member", async ({ browser, request }) => {
  const ownerContext = await browser.newContext();
  const memberContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const memberPage = await memberContext.newPage();

  try {
    const suffix = `${Date.now()}`;
    const memberEmail = uniqueEmail(`invitee-${suffix}`);
    await registerViaUi(ownerPage, request, { name: "Invite Owner" });

    await ownerPage.goto("/organizations");
    await expect(ownerPage.getByRole("heading", { name: "Organizations" })).toBeVisible();

    const teamSlug = `team-${suffix}`;
    await ownerPage.getByRole("textbox", { name: "Organization name" }).fill("Invite Team");
    await ownerPage.getByRole("textbox", { name: "Slug" }).fill(teamSlug);
    await ownerPage.getByRole("button", { name: "Create organization" }).click();
    await expect(ownerPage.getByText(`${teamSlug} · active`)).toBeVisible();

    await ownerPage.getByRole("textbox", { name: "Email" }).fill(memberEmail);
    await ownerPage.getByRole("button", { name: "Send invitation" }).click();
    await expect(ownerPage.getByText(memberEmail, { exact: true })).toBeVisible();

    await expect
      .poll(
        async () => {
          const mailbox = await getMailbox(request, memberEmail);
          return mailbox.messages.some((message) => /Join Invite Team/i.test(message.subject));
        },
        { timeout: 10_000 },
      )
      .toBe(true);

    const mailbox = await getMailbox(request, memberEmail);
    const invite = mailbox.messages.find((message) => /Join Invite Team/i.test(message.subject));
    expect(invite).toBeDefined();
    const inviteLink = invite?.text.match(/https?:\/\/[^\s"'<>]+/)?.[0];
    if (!inviteLink) {
      throw new Error("Invitation email did not include a link");
    }

    await registerViaUi(memberPage, request, {
      name: "Invite Member",
      email: memberEmail,
    });

    await memberPage.goto(inviteLink);
    await expect(
      memberPage.getByRole("heading", { name: "Organization invitation" }),
    ).toBeVisible();
    await memberPage.getByRole("button", { name: "Accept invitation" }).click();
    await expect(memberPage).toHaveURL(/\/me/, { timeout: 15_000 });
    await expect(memberPage.getByText("Invite Team")).toBeVisible();
    await expect(memberPage.getByText(/ · member/)).toBeVisible();
    await expect(memberPage.getByRole("link", { name: "View subscription" })).toBeVisible();

    await memberPage.goto("/subscription");
    await expect(memberPage.getByText("Members cannot manage billing")).toBeVisible();
  } finally {
    await ownerContext.close();
    await memberContext.close();
  }
});
