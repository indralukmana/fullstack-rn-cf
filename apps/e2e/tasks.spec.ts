import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test("tasks feature screen loads for a signed-in user", async ({ page, request }) => {
  await registerViaUi(page, request, { name: "Feature Author" });
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toBeVisible();
});
