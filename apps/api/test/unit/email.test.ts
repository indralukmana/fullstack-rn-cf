import { describe, expect, it, vi } from "vitest";

import { sendEmail } from "../../src/lib/email/send";

const message = {
  to: "customer@example.com",
  subject: "Verify your email",
  text: "Use the verification link.",
  html: "<p>Use the verification link.</p>",
};

describe("sendEmail", () => {
  it("delivers through the Cloudflare Email Service binding", async () => {
    const send = vi.fn(async () => ({ messageId: "message-123" }));

    await sendEmail(
      {
        ENVIRONMENT: "production",
        EMAIL_PROVIDER: "cloudflare",
        EMAIL_FROM: "RN CF <noreply@example.com>",
        EMAIL: { send },
      },
      message,
    );

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({
      from: "RN CF <noreply@example.com>",
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  });

  it("requires the Cloudflare binding when selected", async () => {
    await expect(
      sendEmail(
        {
          ENVIRONMENT: "production",
          EMAIL_PROVIDER: "cloudflare",
          EMAIL_FROM: "noreply@example.com",
        },
        message,
      ),
    ).rejects.toThrow("EMAIL binding is required");
  });

  it("never permits console delivery in production", async () => {
    await expect(
      sendEmail(
        {
          ENVIRONMENT: "production",
          EMAIL_PROVIDER: "console",
          EMAIL_FROM: "noreply@example.com",
        },
        message,
      ),
    ).rejects.toThrow("Console email delivery is disabled in production");
  });
});
