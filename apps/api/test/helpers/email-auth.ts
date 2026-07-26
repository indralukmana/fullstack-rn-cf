import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";

import worker from "../../src/index";
import { extractLink } from "../../src/lib/email/outbox";
import { clearOutboundEmails } from "../../src/lib/email/send";
import { getSessionCookie, postAuth } from "./api-request";

const webOrigin = "http://127.0.0.1:8081";
const apiOrigin = "http://127.0.0.1:8787";

type MailboxResponse = {
  messages: Array<{ to: string; subject: string; text: string }>;
};

export async function clearMailbox() {
  clearOutboundEmails();
  const ctx = createExecutionContext();
  const response = await worker.fetch(
    new Request(`${apiOrigin}/api/dev/mailbox`, { method: "DELETE" }),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

export async function getMailbox(to?: string) {
  const ctx = createExecutionContext();
  const url = to
    ? `${apiOrigin}/api/dev/mailbox?to=${encodeURIComponent(to)}`
    : `${apiOrigin}/api/dev/mailbox`;
  const response = await worker.fetch(new Request(url), env, ctx);
  await waitOnExecutionContext(ctx);
  const body: MailboxResponse = await response.json();
  return body;
}

/** Verify without callbackURL so Better Auth returns JSON instead of redirecting. */
export async function verifyEmailToken(token: string) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(
    new Request(`${apiOrigin}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { Origin: webOrigin },
    }),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

export function tokenFromVerificationLink(link: string): string {
  const token = new URL(link).searchParams.get("token");
  if (!token) {
    throw new Error(`Verification link missing token: ${link}`);
  }
  return token;
}

export function tokenFromResetLink(link: string): string {
  const pathname = new URL(link).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const token = segments.findLast(() => true) ?? segments[segments.length - 1];
  if (!token) {
    throw new Error(`Reset link missing token: ${link}`);
  }
  return token;
}

export async function signUpVerifiedUser(options: {
  email: string;
  password?: string;
  name?: string;
}) {
  await clearMailbox();

  const password = options.password ?? "testpassword123";
  const name = options.name ?? "Verified User";

  const signUp = await postAuth("/api/auth/sign-up/email", {
    email: options.email,
    password,
    name,
    callbackURL: `${webOrigin}/me`,
  });

  if (!signUp.ok) {
    throw new Error(`Expected OK sign-up response, got ${signUp.status}`);
  }

  const mailbox = await getMailbox(options.email);
  const verification = mailbox.messages.find((message) => /verify/i.test(message.subject));
  if (!verification) {
    throw new Error(`No verification email for ${options.email}`);
  }

  const link = extractLink(verification.text);
  if (!link) {
    throw new Error("Verification email did not include a link");
  }

  const verified = await verifyEmailToken(tokenFromVerificationLink(link));
  if (!verified.ok) {
    throw new Error(`Expected OK verify response, got ${verified.status}`);
  }

  return {
    email: options.email,
    password,
    name,
    signUp,
    verified,
    cookie: getSessionCookie(verified),
    verificationLink: link,
  };
}

export async function requestPasswordReset(email: string) {
  await clearMailbox();
  const response = await postAuth("/api/auth/request-password-reset", {
    email,
    redirectTo: `${webOrigin}/reset-password`,
  });
  if (!response.ok) {
    throw new Error(`Expected OK reset request, got ${response.status}`);
  }

  const mailbox = await getMailbox(email);
  const reset = mailbox.messages.find((message) => /reset/i.test(message.subject));
  if (!reset) {
    throw new Error(`No reset email for ${email}`);
  }

  const link = extractLink(reset.text);
  if (!link) {
    throw new Error("Reset email did not include a link");
  }

  return {
    response,
    resetLink: link,
    token: tokenFromResetLink(link),
    message: reset,
  };
}
