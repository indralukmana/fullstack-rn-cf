import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text } from "react-native";

import { fontSans, fontSansSemiBold } from "@/lib/fonts";

type PressableProps = ComponentProps<typeof Pressable>;

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
      ? "border border-border bg-elevated active:bg-selected"
      : variant === "danger"
        ? "bg-danger-strong active:opacity-80"
        : "bg-action active:opacity-80";
  const labelClassName =
    variant === "secondary"
      ? "text-center font-semibold text-foreground"
      : "text-center font-semibold text-on-action";

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-12 w-full justify-center rounded-lg px-5 py-3.5 ${variantClassName} ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
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

export const fieldClassName =
  "rounded-lg border border-border bg-elevated px-4 py-3.5 text-base text-foreground";
