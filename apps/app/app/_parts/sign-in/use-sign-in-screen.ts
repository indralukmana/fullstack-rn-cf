import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { appCallbackUrl } from "@/lib/app-url";
import { authClient } from "@/lib/auth-client";
import { validateEmail, validatePassword } from "@/lib/validation";

export function useSignInScreen() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      return;
    }

    setPending(true);
    setPasswordError(null);
    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: appCallbackUrl("/me"),
    });
    setPending(false);

    if (result.error) {
      const message = result.error.message ?? "Sign in failed";
      if (/verif/i.test(message) || result.error.code === "EMAIL_NOT_VERIFIED") {
        router.replace({
          pathname: "/check-email",
          params: { email: email.trim(), purpose: "verify" },
        });
        return;
      }
      setPasswordError(message);
      return;
    }

    if (typeof params.returnTo === "string") {
      const returnUrl = new URL(params.returnTo, "https://app.local");
      const invitationId = returnUrl.searchParams.get("id");
      if (
        returnUrl.origin === "https://app.local" &&
        returnUrl.pathname === "/accept-invitation" &&
        invitationId
      ) {
        router.replace({
          pathname: "/accept-invitation",
          params: { id: invitationId },
        });
        return;
      }
      if (returnUrl.origin === "https://app.local" && returnUrl.pathname === "/subscription") {
        router.replace("./subscription");
        return;
      }
    }

    router.replace("/me");
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    emailError,
    setEmailError,
    passwordError,
    setPasswordError,
    pending,
    onSubmit,
  };
}
