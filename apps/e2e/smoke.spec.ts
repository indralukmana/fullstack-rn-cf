import { expect, test } from "@playwright/test";

test("web app loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RN CF" }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("api health responds", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:8787/health");

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ status: "ok" });
});

test("api doc returns openapi json", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:8787/doc");

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    info: { title: "RN CF API" },
    openapi: "3.0.0",
  });
});
