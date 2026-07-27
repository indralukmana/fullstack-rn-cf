import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test("notes feature screen loads for a signed-in user", async ({ page, request }) => {
  await registerViaUi(page, request, { name: "Feature Author" });
  await page.goto("/notes");
  await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toBeVisible();
});
