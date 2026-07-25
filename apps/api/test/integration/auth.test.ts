import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { createDb } from "../../src/db/client";
import { user } from "../../src/db/schema/auth";
import { postAuth } from "../helpers/auth-request";
import { getMailbox } from "../helpers/email-auth";

describe("auth integration", () => {
  it("signs up a new user and queues a verification email", async () => {
    const email = `signup-${Date.now()}@example.com`;

    const response = await postAuth("/api/auth/sign-up/email", {
      email,
      password: "testpassword123",
      name: "New User",
      callbackURL: "http://127.0.0.1:8081/me",
    });

    expect(response.status).toBe(200);

    const mailbox = await getMailbox(email);
    expect(mailbox.messages.some((message) => /verify/i.test(message.subject))).toBe(true);
  });

  it("rejects duplicate emails via the D1 unique index", async () => {
    const db = createDb(env.DB);
    const email = `unique-${Date.now()}@example.com`;
    const now = new Date();

    await db.insert(user).values({
      id: `user-${Date.now()}`,
      name: "First User",
      email,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      db.insert(user).values({
        id: `user-${Date.now()}-duplicate`,
        name: "Second User",
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      }),
    ).rejects.toThrow(/unique/i);
  });
});
