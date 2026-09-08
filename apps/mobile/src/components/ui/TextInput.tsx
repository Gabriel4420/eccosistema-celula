import React from "react";
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
  type ViewStyle
} from "react-native";
import { Text } from "./Text";

type Props = RNTextInputProps & {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function TextInput({
  label,
  error,
  containerStyle,
  ...props
}: Props): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="label" color="#374151" style={styles.label}>
        {label}
      </Text>
      <RNTextInput
        style={[styles.input, props.editable === false && styles.disabled]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error ? (
        <Text variant="caption" color="#DC2626" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    marginBottom: 6
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#111827"
  },
  disabled: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280"
  },
  error: {
    marginTop: 4
  }
});