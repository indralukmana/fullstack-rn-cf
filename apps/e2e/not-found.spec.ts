import { expect, test } from "@playwright/test";

test("unknown route stays on app shell", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");

  // Expo Router unmatched routes still render within the app; ensure the shell is alive.
  await expect(page.getByText("RN CF").first()).toBeVisible({ timeout: 30_000 });
});
