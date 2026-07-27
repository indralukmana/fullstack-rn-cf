import { expect, test } from "@playwright/test";

import { registerViaUi } from "./helpers/auth";

test("creates and activates an organization", async ({ page, request }) => {
  await registerViaUi(page, request, { name: "E2E Author" });
  await page.goto("/organizations");

  await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
  await expect(page.getByText("E2E Author's organization")).toBeVisible();
  await expect(page.getByText(/ · active/)).toBeVisible();

  await page.getByRole("textbox", { name: "Organization name" }).fill("E2E Company");
  const slug = `e2e-${Date.now()}`;
  await page.getByRole("textbox", { name: "Slug" }).fill(slug);
  await page.getByRole("button", { name: "Create organization" }).click();

  await expect(page.getByText("E2E Company")).toBeVisible();
  await expect(page.getByText(`${slug} · active`)).toBeVisible();

  await page.goto("/me");
  await expect(page.getByRole("heading", { name: "Account" }).last()).toBeVisible();
  await expect(page.getByText("E2E Company")).toBeVisible();
  await expect(page.getByRole("link", { name: "Switch organization" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage subscription" })).toBeVisible();
});
