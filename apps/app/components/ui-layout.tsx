import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fontDisplay, fontSans, fontSansSemiBold } from "@/lib/fonts";

export function Screen({
  children,
  centered = false,
  scroll = false,
}: {
  children: ReactNode;
  centered?: boolean;
  scroll?: boolean;
}) {
  const body = (
    <View
      className={`w-full max-w-lg gap-5 self-center ${
        centered ? "flex-grow justify-center px-6 py-10" : "px-6 py-8"
      } ${centered || scroll ? "" : "flex-1"}`}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <SafeAreaView
        className="flex-1 bg-canvas"
        edges={["bottom", "left", "right"]}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          {body}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 bg-canvas ${centered ? "justify-center" : ""}`}
      edges={["bottom", "left", "right"]}
      style={{ flex: 1 }}
    >
      {body}
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
