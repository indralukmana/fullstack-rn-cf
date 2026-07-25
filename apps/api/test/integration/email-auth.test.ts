import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { user } from "../../src/db/schema/auth";
import { extractLink } from "../../src/lib/email/outbox";
import { getApi, getSessionCookie, postAuth } from "../helpers/api-request";
import {
  getMailbox,
  requestPasswordReset,
  signUpVerifiedUser,
  tokenFromVerificationLink,
  verifyEmailToken,
} from "../helpers/email-auth";

describe("email verification", () => {
  it("creates an unverified user and verifies via the emailed token", async () => {
    const email = `verify-${Date.now()}@example.com`;
    const password = "testpassword123";
    const db = createDb(env.DB);

    const signUp = await postAuth("/api/auth/sign-up/email", {
      email,
      password,
      name: "Unverified User",
      callbackURL: "http://127.0.0.1:8081/me",
    });
    expect(signUp.status).toBe(200);

    const before = await db.select().from(user).where(eq(user.email, email)).get();
    expect(before?.emailVerified).toBe(false);

    const mailbox = await getMailbox(email);
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

    const verified = await verifyEmailToken(tokenFromVerificationLink(link));
    expect(verified.status).toBe(200);

    const after = await db.select().from(user).where(eq(user.email, email)).get();
    expect(after?.emailVerified).toBe(true);

    const signIn = await postAuth("/api/auth/sign-in/email", {
      email,
      password,
    });
    expect(signIn.status).toBe(200);
    expect(getSessionCookie(signIn)).toBeTruthy();
  });

  it("issues a session cookie when autoSignInAfterVerification is enabled", async () => {
    const email = `autosignin-${Date.now()}@example.com`;
    const { cookie, verified } = await signUpVerifiedUser({ email, name: "Auto User" });

    expect(verified.status).toBe(200);
    expect(cookie).toBeTruthy();

    const me = await getApi("/api/me", cookie);
    expect(me.status).toBe(200);
    await expect(me.json()).resolves.toMatchObject({
      user: { email, name: "Auto User" },
    });
  });
});

describe("password reset", () => {
  it("resets the password via the emailed link token", async () => {
    const email = `reset-${Date.now()}@example.com`;
    const oldPassword = "testpassword123";
    const newPassword = "brand-new-password-456";

    await signUpVerifiedUser({ email, password: oldPassword, name: "Reset User" });

    const { token } = await requestPasswordReset(email);

    const reset = await postAuth("/api/auth/reset-password", {
      token,
      newPassword,
    });
    expect(reset.status).toBe(200);

    const newSignIn = await postAuth("/api/auth/sign-in/email", {
      email,
      password: newPassword,
    });
    expect(newSignIn.status).toBe(200);
    expect(getSessionCookie(newSignIn)).toBeTruthy();
  });
});
