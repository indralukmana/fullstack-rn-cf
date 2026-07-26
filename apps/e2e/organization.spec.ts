import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test("creates and activates an organization", async ({ page, request }) => {
  await registerViaUi(page, request);
  await page.goto("/organizations");

  await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
  await page.getByLabel("Organization name").fill("E2E Company");
  const slug = `e2e-${Date.now()}`;
  await page.getByLabel("Slug").fill(slug);
  await page.getByRole("button", { name: "Create organization" }).click();

  await expect(page.getByText("E2E Company")).toBeVisible();
  await expect(page.getByText(`${slug} · active`)).toBeVisible();
});
