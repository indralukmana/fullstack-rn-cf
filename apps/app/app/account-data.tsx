import { Redirect } from "expo-router";

import {
  Button,
  ConfirmDialog,
  LoadingScreen,
  QuietLink,
  Screen,
  ScreenLead,
  ScreenTitle,
  StatusText,
} from "@/components/ui";
import { DeleteAccountSection } from "@/src/parts/account-data/delete-account-section";
import { useAccountDataScreen } from "@/src/parts/account-data/use-account-data-screen";

export default function AccountDataScreen() {
  const {
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
  } = useAccountDataScreen();

  if (sessionPending) {
    return <LoadingScreen label="Checking your account…" />;
  }
  if (!session?.user) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Screen scroll>
      <ScreenTitle>Account data</ScreenTitle>
      <ScreenLead>Export a portable copy of account, membership, and subscription data.</ScreenLead>

      <Button disabled={pending} label="Export my data" onPress={onExport} variant="secondary" />

      <DeleteAccountSection
        confirmation={confirmation}
        onRequestDelete={onRequestDelete}
        pending={pending}
        setConfirmation={setConfirmation}
      />

      {message ? <StatusText>{message}</StatusText> : null}

      <QuietLink href="/me">Back to account</QuietLink>

      <ConfirmDialog
        confirmLabel="Delete account"
        destructive
        message="This permanently removes your account data. Store and Stripe subscriptions are not canceled by this action."
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void onDelete()}
        pending={pending}
        title="Delete account?"
        visible={confirmDeleteOpen}
      />
    </Screen>
  );
}
