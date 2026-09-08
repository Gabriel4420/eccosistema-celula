import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "./Text";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

type Props = {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
};

const variantColors: Record<BadgeVariant, { bg: string; fg: string }> = {
  success: { bg: "#DCFCE7", fg: "#166534" },
  warning: { bg: "#FEF3C7", fg: "#92400E" },
  error: { bg: "#FEE2E2", fg: "#991B1B" },
  info: { bg: "#DBEAFE", fg: "#1E40AF" },
  neutral: { bg: "#F3F4F6", fg: "#374151" }
};

export function Badge({
  label,
  variant = "neutral",
  style
}: Props): React.JSX.Element {
  const colors = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text variant="caption" color={colors.fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

export function getSyncBadgeVariant(
  syncStatus: string
): { label: string; variant: BadgeVariant } {
  switch (syncStatus) {
    case "SYNCED":
      return { label: "Sincronizado", variant: "success" };
    case "PENDING":
      return { label: "Pendente", variant: "warning" };
    case "ERROR":
      return { label: "Erro", variant: "error" };
    default:
      return { label: syncStatus, variant: "neutral" };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start"
  },
  text: {
    fontWeight: "600"
  }
});