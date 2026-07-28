import { useState, type ComponentProps } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { fontSans, fontSansSemiBold } from "@/lib/fonts";
import { useThemeColors } from "@/lib/theme-colors";

import { fieldClassName, StatusText } from "./ui-primitives";

type TextInputProps = ComponentProps<typeof TextInput>;

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      className="text-sm font-medium text-foreground-secondary"
      style={{ fontFamily: fontSansSemiBold }}
    >
      {label}
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
    <View className="gap-2">
      <FieldLabel label={label} />
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
  testID,
}: {
  label: string;
  error?: string | null;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoComplete?: TextInputProps["autoComplete"];
  testID?: string;
}) {
  const [visible, setVisible] = useState(false);
  const { placeholder: placeholderColor } = useThemeColors();

  return (
    <View className="gap-2">
      <FieldLabel label={label} />
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
          testID={testID}
          value={value}
        />
        <Pressable
          accessibilityLabel={visible ? "Hide characters" : "Show characters"}
          accessibilityRole="button"
          className="absolute inset-y-0 right-0 justify-center px-3 active:opacity-70"
          onPress={() => setVisible((current) => !current)}
        >
          <Text
            className="text-sm font-semibold text-foreground-secondary"
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
