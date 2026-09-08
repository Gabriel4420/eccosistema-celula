import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native";
import { Text } from "./ui/Text";

export function LoadingScreen({
  label = "Carregando..."
}: {
  label?: string;
}): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text variant="label" color="#6B7280" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    padding: 24
  },
  label: {
    marginTop: 12
  }
});