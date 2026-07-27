import { useCallback, useEffect, useState } from "react";

import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import {
  type DevMailboxMessage,
  extractEmailLink,
  fetchDevMailbox,
  isDevMailboxUiEnabled,
  devMailboxUrl,
} from "@/lib/dev-mailbox";

export function useCheckEmailScreen(email: string, purpose: "reset" | "verify") {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mailboxError, setMailboxError] = useState<string | null>(null);
  const [latestMessage, setLatestMessage] = useState<DevMailboxMessage | null>(null);
  const showDevMailbox = isDevMailboxUiEnabled() && Boolean(email);
  const mailboxApiUrl = email ? devMailboxUrl(email) : null;
  const latestLink = latestMessage ? extractEmailLink(latestMessage.text) : null;

  const refreshMailbox = useCallback(async () => {
    if (!showDevMailbox || !email) {
      return;
    }
    try {
      const messages = await fetchDevMailbox(email);
      setLatestMessage(messages[0] ?? null);
      setMailboxError(null);
    } catch (refreshError) {
      setLatestMessage(null);
      setMailboxError(
        refreshError instanceof Error ? refreshError.message : "Could not load local mailbox",
      );
    }
  }, [email, showDevMailbox]);

  useEffect(() => {
    void refreshMailbox();
  }, [refreshMailbox]);

  async function onResend() {
    if (!email) {
      setError("Missing email address");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    if (purpose === "reset") {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: appCallbackUrl("/reset-password"),
      });
      setPending(false);
      if (result.error) {
        setError(result.error.message ?? "Could not resend reset email");
        return;
      }
      setMessage("If an account exists for that email, another reset link was sent.");
      await refreshMailbox();
      return;
    }

    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: appCallbackUrl("/me"),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not resend verification email");
      return;
    }
    setMessage("Verification email sent again.");
    await refreshMailbox();
  }

  return {
    message,
    error,
    pending,
    mailboxError,
    latestMessage,
    showDevMailbox,
    mailboxApiUrl,
    latestLink,
    refreshMailbox,
    onResend,
  };
}
