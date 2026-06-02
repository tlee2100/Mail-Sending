import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radii } from "../theme";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "success" | "danger";
  style?: ViewStyle;
};

export function AppButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
}: AppButtonProps) {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.surface} />
      ) : (
        <Text style={[styles.text, isSecondary && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  secondary: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderWidth: 1,
  },
  success: {
    backgroundColor: colors.success,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  danger: {
    backgroundColor: colors.danger,
    shadowColor: colors.magenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryText: {
    color: colors.primary,
  },
});
