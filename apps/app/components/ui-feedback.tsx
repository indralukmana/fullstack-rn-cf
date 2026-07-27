import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fontSans, fontSansSemiBold } from "@/lib/fonts";

import { Button, StatusText } from "./ui-primitives";

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
