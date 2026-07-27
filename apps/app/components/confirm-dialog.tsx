import { useEffect, useId } from "react";
import { AccessibilityInfo, Modal, Text, View } from "react-native";

import { fontDisplay, fontSans } from "@/lib/fonts";

import { Button } from "./ui-primitives";
import { useConfirmDialogFocus } from "./use-confirm-dialog-focus";

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reactId = useId().replace(/:/g, "");
  const dialogId = `confirm-dialog-${reactId}`;
  const confirmId = `confirm-action-${reactId}`;

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);
    return undefined;
  }, [visible, title, message]);

  useConfirmDialogFocus({ visible, title, message, dialogId, confirmId, onCancel });

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-scrim px-6">
        <View
          accessibilityRole="summary"
          accessibilityViewIsModal
          className="w-full max-w-md gap-4 rounded-lg border border-border bg-elevated p-5"
          nativeID={dialogId}
        >
          <Text
            accessibilityRole="header"
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: fontDisplay }}
          >
            {title}
          </Text>
          <Text
            className="text-base leading-6 text-foreground-secondary"
            style={{ fontFamily: fontSans }}
          >
            {message}
          </Text>
          <View className="gap-3">
            <Button
              disabled={pending}
              label={pending ? "Working…" : confirmLabel}
              nativeID={confirmId}
              onPress={onConfirm}
              variant={destructive ? "danger" : "primary"}
            />
            <Button disabled={pending} label={cancelLabel} onPress={onCancel} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}
