import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test.describe("personal subscription", () => {
  test("protects the paywall from signed-out visitors", async ({ page }) => {
    await page.goto("/subscription");
    await expect(page.getByPlaceholder("Email")).toBeVisible();
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
});
