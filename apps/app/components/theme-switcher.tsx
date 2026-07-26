import { Pressable, View } from "react-native";
import { Uniwind, useUniwind } from "uniwind";

import { BodyText } from "@/components/ui";

const choices = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

export function ThemeSwitcher() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const active = hasAdaptiveThemes ? "system" : theme;

  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = active === choice.id;
        return (
          <Pressable
            key={choice.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className={`rounded-lg border px-3 py-2 ${
              selected ? "border-foreground bg-selected" : "border-border bg-elevated"
            }`}
            onPress={() => Uniwind.setTheme(choice.id)}
          >
            <BodyText
              className={selected ? "text-foreground" : "text-foreground-secondary"}
              weight="semibold"
            >
              {choice.label}
            </BodyText>
          </Pressable>
        );
      })}
    </View>
  );
}
