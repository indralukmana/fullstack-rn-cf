import { exportAccountData, useDeleteAccount } from "@rn-cf/api-client";
import { router } from "expo-router";
import { useState } from "react";
import { Share } from "react-native";

import { authClient } from "@/lib/auth-client";
import { clearNativeBillingIdentity } from "@/lib/billing/revenuecat";

import { accountDataErrorMessage } from "./account-data-utils";

export function useAccountDataScreen() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const deleteAccount = useDeleteAccount();
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onExport() {
    setPending(true);
    setMessage(null);
    try {
      const result = await exportAccountData();
      if (!("account" in result.data)) {
        throw new Error(result.data.message);
      }
      await Share.share({
        title: "Account data export",
        message: JSON.stringify(result.data, null, 2),
      });
    } catch (error) {
      setMessage(accountDataErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  function onRequestDelete() {
    if (confirmation !== "DELETE") {
      setMessage("Type DELETE exactly to confirm.");
      return;
    }
    setMessage(null);
    setConfirmDeleteOpen(true);
  }

  async function onDelete() {
    setPending(true);
    setMessage(null);
    try {
      const result = await deleteAccount.mutateAsync({ data: { confirmation: "DELETE" } });
      if (!("deleted" in result.data)) {
        throw new Error(result.data.message);
      }
      setConfirmDeleteOpen(false);
      await clearNativeBillingIdentity();
      await authClient.signOut();
      router.replace("/");
    } catch (error) {
      setMessage(accountDataErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return {
    session,
    sessionPending,
    confirmation,
    setConfirmation,
    pending,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    message,
    onExport,
    onRequestDelete,
    onDelete,
  };
}
