import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-slate-50 px-6">
      <Text accessibilityRole="header" className="text-center text-4xl font-bold text-slate-900">
        RN CF
      </Text>
      <Text className="max-w-md text-center text-base text-slate-600">
        Cloudflare Workers API with a universal Expo app for iOS, Android, and web.
      </Text>
      <View className="flex-row flex-wrap items-center justify-center gap-3">
        <Link href="/sign-up" asChild>
          <Pressable accessibilityRole="button" className="rounded-lg bg-slate-900 px-5 py-3">
            <Text className="font-semibold text-white">Get started</Text>
          </Pressable>
        </Link>
        <Link href="/sign-in" asChild>
          <Pressable
            accessibilityRole="button"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3"
          >
            <Text className="font-semibold text-slate-900">Sign in</Text>
          </Pressable>
        </Link>
        <Link href="/me" asChild>
          <Pressable
            accessibilityRole="button"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3"
          >
            <Text className="font-semibold text-slate-900">Account</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
