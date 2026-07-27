import { View } from "react-native";

import { Button, Field, Section, StatusText } from "@/components/ui";

import type { FeatureItemsScreenState } from "./use-feature-items-screen";

type FeatureItemCreateSectionProps = Pick<
  FeatureItemsScreenState,
  | "titleValue"
  | "setTitleValue"
  | "bodyValue"
  | "setBodyValue"
  | "createMutation"
  | "error"
  | "onCreate"
>;

export function FeatureItemCreateSection({
  titleValue,
  setTitleValue,
  bodyValue,
  setBodyValue,
  createMutation,
  error,
  onCreate,
}: FeatureItemCreateSectionProps) {
  return (
    <Section title="Create">
      <View className="gap-3">
        <Field label="Title" onChangeText={setTitleValue} value={titleValue} placeholder="Title" />
        <Field
          label="Body"
          onChangeText={setBodyValue}
          value={bodyValue}
          placeholder="Optional details"
        />
        <Button
          disabled={createMutation.isPending}
          label={createMutation.isPending ? "Saving…" : "Create"}
          onPress={() => void onCreate()}
        />
        {error ? <StatusText>{error}</StatusText> : null}
      </View>
    </Section>
  );
}
