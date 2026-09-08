import React from "react";
import { StyleSheet, type TextProps } from "react-native";

type Props = TextProps & {
  children: React.ReactNode;
  variant?: "body" | "label" | "title" | "subtitle" | "caption" | "bold";
  color?: string;
  align?: "left" | "center" | "right";
};

const variantStyles: Record<string, object> = {
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  subtitle: { fontSize: 17, lineHeight: 23, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16 },
  bold: { fontSize: 15, lineHeight: 22, fontWeight: "700" }
};

export function Text({
  children,
  variant = "body",
  color = "#111827",
  align = "left",
  style,
  ...props
}: Props): React.JSX.Element {
  return (
<Text
        style={[styles.text, variantStyles[variant], { color, textAlign: align }, style]}
        {...props}
      >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: "System"
  }
});