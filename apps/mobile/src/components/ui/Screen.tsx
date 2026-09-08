import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
  type ScrollViewProps
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = ScrollViewProps & {
  children: React.ReactNode;
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({
  children,
  padded = true,
  style,
  ...props
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        padded && styles.padded,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }
      ]}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

type FullScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function FullScreen({
  children,
  style
}: FullScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.fullScreen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB"
  },
  padded: {
    paddingHorizontal: 16
  },
  fullScreen: {
    flex: 1,
    backgroundColor: "#F9FAFB"
  }
});