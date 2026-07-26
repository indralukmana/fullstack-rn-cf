import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { API_ORIGIN, TEST_PASSWORD } from "./constants";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function extractLink(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>]+/);
  return match?.[0] ?? null;
}

type MailboxMessage = { to: string; subject: string; text: string };
type MailboxResponse = { messages: MailboxMessage[] };

function isMailboxMessage(value: unknown): value is MailboxMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof Reflect.get(value, "to") === "string" &&
    typeof Reflect.get(value, "subject") === "string" &&
    typeof Reflect.get(value, "text") === "string"
  );
}

function isMailboxResponse(value: unknown): value is MailboxResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const messages = Reflect.get(value, "messages");
  return Array.isArray(messages) && messages.every(isMailboxMessage);
}

export async function getMailbox(request: APIRequestContext, to?: string) {
  const url = to
    ? `${API_ORIGIN}/api/dev/mailbox?to=${encodeURIComponent(to)}`
    : `${API_ORIGIN}/api/dev/mailbox`;
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body: unknown = await response.json();
  if (!isMailboxResponse(body)) {
    throw new Error("Unexpected mailbox response");
  }
  return body;
}

export async function verifyEmailFromMailbox(
  request: APIRequestContext,
  page: Page,
  email: string,
) {
  await expect
    .poll(
      async () => {
        const mailbox = await getMailbox(request, email);
        return mailbox.messages.some((message) => /verify/i.test(message.subject));
      },
      { timeout: 5_000 },
    )
    .toBe(true);
  const mailbox = await getMailbox(request, email);
  const verification = mailbox.messages.find((message) => /verify/i.test(message.subject));
  expect(verification).toBeDefined();
  if (!verification) {
    throw new Error("missing verification email");
  }

  const link = extractLink(verification.text);
  expect(link).toBeTruthy();
  if (!link) {
    throw new Error("missing verification link");
  }

  // Follow the emailed link so Better Auth can set the session cookie and redirect.
  await page.goto(link);
  await expect(page).toHaveURL(/\/me/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Account" }).last()).toBeVisible();
}

export async function registerViaUi(
  page: Page,
  request: APIRequestContext,
  options: {
    name?: string;
    email?: string;
    password?: string;
  } = {},
) {
  const email = options.email ?? uniqueEmail("e2e");
  const name = options.name ?? "E2E Author";
  const password = options.password ?? TEST_PASSWORD;

  await page.goto("/sign-up");
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/check-email/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  await verifyEmailFromMailbox(request, page, email);

  return { email, name, password };
}
