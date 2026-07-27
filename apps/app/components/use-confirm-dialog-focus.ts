import { useEffect } from "react";
import { Platform } from "react-native";

export function useConfirmDialogFocus({
  visible,
  title,
  message,
  dialogId,
  confirmId,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  dialogId: string;
  confirmId: string;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    if (Platform.OS !== "web" || typeof document === "undefined") {
      return undefined;
    }

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      document.getElementById(confirmId)?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const root = document.getElementById(dialogId);
      if (!root) {
        return;
      }
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [visible, title, message, dialogId, confirmId, onCancel]);
}
