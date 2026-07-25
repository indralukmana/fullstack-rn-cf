import { expect, test } from "@playwright/test";

import { registerViaUi, uniqueEmail } from "./helpers/auth";
import { API_ORIGIN, TEST_PASSWORD, WEB_ORIGIN } from "./helpers/constants";

test("register requires email verification before account access", async ({ page, request }) => {
  const { email } = await registerViaUi(page, request, { name: "Verified E2E" });

  await expect(page.getByText(email, { exact: true })).toBeVisible();
});

test("forgot password flow reaches check-email", async ({ page, request }) => {
  const email = uniqueEmail("reset-e2e");

  await request.post(`${API_ORIGIN}/api/auth/sign-up/email`, {
    headers: { Origin: WEB_ORIGIN },
    data: {
      email,
      password: TEST_PASSWORD,
      name: "Reset E2E",
      callbackURL: `${WEB_ORIGIN}/me`,
    },
  });

  await page.goto("/forgot-password");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page).toHaveURL(/\/check-email/);
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test("duplicate sign-up follows the check-email path without leaking accounts", async ({
  page,
  request,
}) => {
  const email = uniqueEmail("duplicate");

  const firstSignUp = await request.post(`${API_ORIGIN}/api/auth/sign-up/email`, {
    headers: { Origin: WEB_ORIGIN },
    data: {
      email,
      password: TEST_PASSWORD,
      name: "Existing User",
      callbackURL: `${WEB_ORIGIN}/me`,
    },
  });
  expect(firstSignUp.ok()).toBeTruthy();

  await page.goto("/sign-up");
  await page.getByPlaceholder("Name").fill("Another User");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // Enumeration protection: UI continues as if signup succeeded.
  await expect(page).toHaveURL(/\/check-email/, { timeout: 15_000 });
});
