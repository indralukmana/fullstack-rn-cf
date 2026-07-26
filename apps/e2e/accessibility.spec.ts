import { expect, test } from "@playwright/test";

test("sign-in exposes labeled fields and primary actions", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show characters" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Need an account? Register" })).toBeVisible();
});

test("sign-up exposes labeled registration fields", async ({ page }) => {
  await page.goto("/sign-up");

  await expect(page.getByRole("heading", { name: "Get started" })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
});

test("home keeps brand heading and primary CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RN CF" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
});
