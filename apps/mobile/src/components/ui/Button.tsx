import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle
} from "react-native";
import { Text } from "./Text";

type Props = {
  children: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

type VariantStyles = {
  primary: { container: ViewStyle; text: TextStyle };
  secondary: { container: ViewStyle; text: TextStyle };
  ghost: { container: ViewStyle; text: TextStyle };
  danger: { container: ViewStyle; text: TextStyle };
};

const variantStyles: VariantStyles = {
    primary: {
      container: { backgroundColor: "#2563EB" },
      text: { color: "#FFFFFF" }
    },
    secondary: {
      container: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#D1D5DB" },
      text: { color: "#111827" }
    },
    ghost: {
      container: { backgroundColor: "transparent" },
      text: { color: "#2563EB" }
    },
    danger: {
      container: { backgroundColor: "#DC2626" },
      text: { color: "#FFFFFF" }
    }
  };

function resolveVariant(
  variant: Props["variant"]
): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case "secondary":
      return variantStyles.secondary;
    case "ghost":
      return variantStyles.ghost;
    case "danger":
      return variantStyles.danger;
    case "primary":
    default:
      return variantStyles.primary;
  }
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle
}: Props): React.JSX.Element {
  const vs = resolveVariant(variant);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        vs.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text.color ?? "#fff"} />
      ) : (
        <Text variant="bold" style={[styles.text, vs.text, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48
  },
  fullWidth: {
    width: "100%"
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    textAlign: "center"
  }
});