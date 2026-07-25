import { expect, test } from "@playwright/test";

test("rejects an incomplete organization invitation link", async ({ page }) => {
  await page.goto("/accept-invitation");

  await expect(page.getByRole("heading", { name: "Organization invitation" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("incomplete");
});

test("returns signed-out invitees to the invitation after sign-in", async ({ page }) => {
  await page.goto("/accept-invitation?id=invitation-test-id");
  await page.getByRole("link", { name: "Sign in to continue" }).click();

  await expect(page).toHaveURL(/\/sign-in\?.*returnTo=/);
  await expect(page.getByPlaceholder("Email")).toBeVisible();
});
