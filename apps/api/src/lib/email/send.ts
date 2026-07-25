import { clearOutboundEmails, listOutboundEmails, recordOutboundEmail } from "./outbox";

export type EmailEnv = {
  ENVIRONMENT?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
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

  if (provider === "resend") {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<p>${input.text}</p>`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend failed (${response.status}): ${body}`);
    }

    // Still record for local debugging when not production.
    if (env.ENVIRONMENT !== "production") {
      recordOutboundEmail(input);
    }

    return;
  }

  const recorded = recordOutboundEmail(input);
  console.info(`[email:console] to=${recorded.to} subject=${recorded.subject}\n${recorded.text}`);
}

export { clearOutboundEmails, listOutboundEmails };
