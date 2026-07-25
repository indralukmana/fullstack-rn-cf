import { expect, test } from "@playwright/test";

test("unknown route renders the Expo fallback", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");

  await expect(page.getByRole("heading", { name: "Unmatched Route" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page could not be found." })).toBeVisible();
});
