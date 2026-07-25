import type { BetterAuthOptions } from "better-auth";

import { sendEmail, type EmailEnv } from "../email/send";

export function createBetterAuthOptions(env: EmailEnv): BetterAuthOptions {
  return {
    appName: "RN CF",
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(env, {
          to: user.email,
          subject: "Reset your RN CF password",
          text: `Reset your password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
          html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p><p>If you did not request this, you can ignore this email.</p>`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(env, {
          to: user.email,
          subject: "Verify your RN CF email",
          text: `Verify your email:\n\n${url}\n\nIf you did not create an account, you can ignore this email.`,
          html: `<p>Verify your email:</p><p><a href="${url}">${url}</a></p><p>If you did not create an account, you can ignore this email.</p>`,
        });
      },
    },
  };
}
