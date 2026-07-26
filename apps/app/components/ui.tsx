import { Link, type Href } from "expo-router";
import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fontDisplay, fontSans, fontSansSemiBold } from "@/lib/fonts";
import { useThemeColors } from "@/lib/theme-colors";

type PressableProps = ComponentProps<typeof Pressable>;
type TextInputProps = ComponentProps<typeof TextInput>;

const fieldClassName =
  "rounded-lg border border-border bg-elevated px-4 py-3.5 text-base text-foreground";

export function Screen({
  children,
  centered = false,
  scroll = false,
}: {
  children: ReactNode;
  centered?: boolean;
  scroll?: boolean;
}) {
  const contentClassName = centered
    ? "flex-grow justify-center gap-5 px-6 py-10"
    : "gap-5 px-6 py-8";

  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={["bottom", "left", "right"]}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={contentClassName}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-lg gap-5 self-center">{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 bg-canvas ${centered ? "justify-center" : ""} px-6 py-8`}
      edges={["bottom", "left", "right"]}
    >
      <View className={`w-full max-w-lg gap-5 self-center ${centered ? "" : "flex-1"}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      accessibilityRole="header"
      className="text-3xl font-bold text-foreground"
      style={{ fontFamily: fontDisplay }}
    >
      {children}
    </Text>
  );
}

export function ScreenLead({ children }: { children: ReactNode }) {
  return (
    <Text
      className="text-base leading-6 text-foreground-secondary"
      style={{ fontFamily: fontSans }}
    >
      {children}
    </Text>
  );
}

export function BodyText({
  children,
  className,
  weight = "regular",
  ...props
}: ComponentProps<typeof Text> & {
  weight?: "regular" | "semibold";
}) {
  return (
    <Text
      className={className}
      style={{ fontFamily: weight === "semibold" ? fontSansSemiBold : fontSans }}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Field({
  label,
  error,
  className,
  style,
  ...rest
}: TextInputProps & {
  label: string;
  error?: string | null;
}) {
  const { placeholder } = useThemeColors();

  return (
    <View className="gap-1.5">
      <Text
        className="text-sm font-medium text-foreground-muted"
        style={{ fontFamily: fontSansSemiBold }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        className={className ? `${fieldClassName} ${className}` : fieldClassName}
        placeholderTextColor={placeholder}
        style={[{ fontFamily: fontSans }, style]}
        {...rest}
      />
      {error ? <StatusText>{error}</StatusText> : null}
    </View>
  );
}

export function PasswordField({
  label,
  error,
  value,
  onChangeText,
  placeholder,
  autoComplete,
}: {
  label: string;
  error?: string | null;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoComplete?: TextInputProps["autoComplete"];
}) {
  const [visible, setVisible] = useState(false);
  const { placeholder: placeholderColor } = useThemeColors();

  return (
    <View className="gap-1.5">
      <Text
        className="text-sm font-medium text-foreground-muted"
        style={{ fontFamily: fontSansSemiBold }}
      >
        {label}
      </Text>
      <View className="relative">
        <TextInput
          accessibilityLabel={label}
          autoComplete={autoComplete}
          className={`${fieldClassName} pr-24`}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={!visible}
          style={{ fontFamily: fontSans }}
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          accessibilityRole="button"
          className="absolute inset-y-0 right-0 justify-center px-3"
          onPress={() => setVisible((current) => !current)}
        >
          <Text
            className="text-sm font-semibold text-foreground-muted"
            style={{ fontFamily: fontSansSemiBold }}
          >
            {visible ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>
      {error ? <StatusText>{error}</StatusText> : null}
    </View>
  );
}

export function Button({
  label,
  variant = "primary",
  className,
  disabled,
  ...props
}: PressableProps & {
  label: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variantClassName =
    variant === "secondary"
      ? "border border-border bg-elevated"
      : variant === "danger"
        ? "bg-danger-strong"
        : "bg-action";
  const labelClassName =
    variant === "secondary"
      ? "text-center font-semibold text-foreground"
      : "text-center font-semibold text-on-action";

  return (
    <Pressable
      accessibilityRole="button"
      className={`rounded-lg px-5 py-3.5 ${variantClassName} ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
      disabled={disabled}
      {...props}
    >
      <Text className={labelClassName} style={{ fontFamily: fontSansSemiBold }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatusText({
  children,
  tone = "danger",
}: {
  children: ReactNode;
  tone?: "danger" | "success" | "muted";
}) {
  const toneClassName =
    tone === "success"
      ? "text-success"
      : tone === "muted"
        ? "text-foreground-secondary"
        : "text-danger";
  return (
    <Text
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      className={`text-sm ${toneClassName}`}
      style={{ fontFamily: fontSans }}
    >
      {children}
    </Text>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3 border-t border-border-subtle pt-5">
      <Text
        className="text-sm font-semibold text-foreground-muted"
        style={{ fontFamily: fontSansSemiBold }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function QuietLinkText({ children }: { children: ReactNode }) {
  return (
    <Text
      className="text-center text-base text-foreground-secondary"
      style={{ fontFamily: fontSans }}
    >
      {children}
    </Text>
  );
}

export function QuietLink({ href, children }: { href: Href; children: ReactNode }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" className="min-h-11 items-center justify-center py-2">
        <QuietLinkText>{children}</QuietLinkText>
      </Pressable>
    </Link>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <View
      accessibilityElementsHidden
      className={`rounded-lg bg-selected ${className ?? "h-4 w-full"}`}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <SafeAreaView
      accessibilityLabel={label}
      className="flex-1 justify-center bg-canvas px-6"
      edges={["bottom", "left", "right"]}
    >
      <View accessibilityRole="progressbar" className="w-full max-w-lg gap-4 self-center">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-2 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </View>
    </SafeAreaView>
  );
}

export function QueryError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="gap-3">
      <StatusText>{message}</StatusText>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text
        className="text-base font-semibold text-foreground"
        style={{ fontFamily: fontSansSemiBold }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          className="text-sm leading-5 text-foreground-secondary"
          style={{ fontFamily: fontSans }}
        >
          {description}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

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
