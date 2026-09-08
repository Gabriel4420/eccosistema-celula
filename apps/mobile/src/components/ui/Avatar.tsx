import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./Text";

type Props = {
  name: string;
  size?: number;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "#2563EB",
    "#7C3AED",
    "#059669",
    "#D97706",
    "#DC2626",
    "#0891B2",
    "#4F46E5",
    "#C2410C"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "#2563EB";
}

export function Avatar({ name, size = 40 }: Props): React.JSX.Element {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor
        }
      ]}
    >
      <Text
        variant="bold"
        color="#FFFFFF"
        style={{ fontSize: size * 0.38 }}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center"
  }
});