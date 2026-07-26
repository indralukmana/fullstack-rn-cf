import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test.describe("personal subscription", () => {
  test("protects the paywall from signed-out visitors", async ({ page }) => {
    await page.goto("/subscription");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("shows server-authoritative web plans to a verified free user", async ({
    page,
    request,
  }) => {
    await registerViaUi(page, request);
    await page.getByRole("link", { name: "View subscription" }).click();

    await expect(page.getByRole("heading", { name: "Pro subscription" }).last()).toBeVisible();
    await expect(page.getByText("Free", { exact: true }).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose monthly" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose yearly" })).toBeVisible();
  });

  test("launches Stripe Checkout and handles the success return", async ({ page, request }) => {
    await registerViaUi(page, request);
    await page.route("**/api/billing/checkout", async (route) => {
      expect(route.request().postDataJSON()).toEqual({ interval: "monthly" });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "http://127.0.0.1:8081/me?checkout=success",
        }),
      });
    });
    await page.getByRole("link", { name: "View subscription" }).click();
    await page.getByRole("button", { name: "Choose monthly" }).click();

    await expect(page).toHaveURL(/\/me\?checkout=success/);
    await expect(page.getByRole("heading", { name: "Account" }).last()).toBeVisible();
  });
});
