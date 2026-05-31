import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "../theme";

type NoticeProps = {
  message: string;
  tone?: "info" | "error" | "success";
};

export function Notice({ message, tone = "info" }: NoticeProps) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={[styles.text, tone === "error" && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    padding: 12,
  },
  info: {
    backgroundColor: "#eff6ff",
  },
  error: {
    backgroundColor: "#fff1f2",
  },
  success: {
    backgroundColor: "#f0fdf4",
  },
  text: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
  },
});
