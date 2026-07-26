import { useUniwind } from "uniwind";

/** JS-side colors for RN props that cannot read CSS variables (e.g. placeholderTextColor). */
export function useThemeColors() {
  const { theme } = useUniwind();
  const dark = theme === "dark";

  return {
    dark,
    placeholder: dark ? "#94a3b8" : "#64748b",
    canvas: dark ? "#0f172a" : "#f8fafc",
    foreground: dark ? "#f8fafc" : "#0f172a",
  };
}
