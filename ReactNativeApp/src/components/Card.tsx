import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { colors, radii, shadow } from "../theme";

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, shadow.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 16,
  },
});
