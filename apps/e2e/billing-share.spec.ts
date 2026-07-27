import { expect, test } from "@playwright/test";

import { signInViaUi } from "./helpers/auth";
import { API_ORIGIN } from "./helpers/constants";

const DEMO_MEMBER_EMAIL = "member@example.com";
const DEMO_PASSWORD = "demo-password-change-me";

test("demo member inherits Pro on the shared workspace", async ({ page, request }) => {
  const seeded = await request.post(`${API_ORIGIN}/api/dev/seed`);
  expect(seeded.ok()).toBeTruthy();

  await signInViaUi(page, {
    email: DEMO_MEMBER_EMAIL,
    password: DEMO_PASSWORD,
  });

  await page.goto("/organizations");
  await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
  await page.getByText("Demo Workspace", { exact: true }).click();
  await expect(page.getByText("demo-workspace · active")).toBeVisible({ timeout: 10_000 });

  await page.goto("/subscription");
  await expect(page.getByRole("heading", { name: "Pro subscription" }).last()).toBeVisible();
  await expect(page.getByText(/Pro ·/)).toBeVisible();
  await expect(page.getByText("Members cannot manage billing")).toBeVisible();

  await page.goto("/me");
  await expect(page.getByText("Demo Workspace")).toBeVisible();
  await expect(page.getByText("Pro", { exact: true })).toBeVisible();
});
