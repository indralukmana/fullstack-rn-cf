import { Link, type Href } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
      {children}
    </Text>
  );
}

export function ScreenLead({ children }: { children: ReactNode }) {
  return <Text className="text-base leading-6 text-foreground-secondary">{children}</Text>;
}

export function Field({
  label,
  error,
  className,
  ...rest
}: TextInputProps & {
  label: string;
  error?: string | null;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        className={className ? `${fieldClassName} ${className}` : fieldClassName}
        placeholderTextColor="#94a3b8"
        {...rest}
      />
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
      <Text className={labelClassName}>{label}</Text>
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
    >
      {children}
    </Text>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3 border-t border-border-subtle pt-5">
      <Text className="text-sm font-semibold text-foreground-muted">{title}</Text>
      {children}
    </View>
  );
}

export function QuietLinkText({ children }: { children: ReactNode }) {
  return <Text className="text-center text-base text-foreground-secondary">{children}</Text>;
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

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <SafeAreaView
      className="flex-1 items-center justify-center bg-canvas px-6"
      edges={["bottom", "left", "right"]}
    >
      <Text className="text-base text-foreground-secondary">{label}</Text>
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
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-scrim px-6">
        <View
          accessibilityRole="summary"
          accessibilityViewIsModal
          className="w-full max-w-md gap-4 rounded-lg border border-border bg-elevated p-5"
        >
          <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
            {title}
          </Text>
          <Text className="text-base leading-6 text-foreground-secondary">{message}</Text>
          <View className="gap-3">
            <Button
              disabled={pending}
              label={pending ? "Working…" : confirmLabel}
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
