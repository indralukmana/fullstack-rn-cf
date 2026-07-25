import { clearOutboundEmails, listOutboundEmails, recordOutboundEmail } from "./outbox";

type CloudflareEmailBinding = {
  send(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{ messageId: string }>;
};

export type EmailEnv = {
  ENVIRONMENT?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  EMAIL?: CloudflareEmailBinding;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(env: EmailEnv, input: SendEmailInput) {
  const provider = (env.EMAIL_PROVIDER ?? "console").toLowerCase();
  const from = env.EMAIL_FROM ?? "RN CF <noreply@localhost>";

  if (provider === "cloudflare") {
    if (!env.EMAIL) {
      throw new Error("EMAIL binding is required when EMAIL_PROVIDER=cloudflare");
    }

    await env.EMAIL.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (env.ENVIRONMENT !== "production") {
      recordOutboundEmail(input);
    }

    return;
  }

  if (provider !== "console") {
    throw new Error("EMAIL_PROVIDER must be either console or cloudflare");
  }

  if (env.ENVIRONMENT === "production") {
    throw new Error("Console email delivery is disabled in production");
  }

  const recorded = recordOutboundEmail(input);
  console.info(`[email:console] to=${recorded.to} subject=${recorded.subject}\n${recorded.text}`);
}

export { clearOutboundEmails, listOutboundEmails };
