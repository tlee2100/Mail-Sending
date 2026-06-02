import { StyleSheet } from "react-native";

export const colors = {
  background: "#edf4ff",
  surface: "#ffffff",
  surfaceSoft: "#f7f4ff",
  border: "#dbe4ff",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#5b4ff2",
  primaryDark: "#3b37c7",
  primarySoft: "#eef2ff",
  violet: "#7c3aed",
  magenta: "#ec4899",
  teal: "#14b8a6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  dark: "#020617",
  darkMuted: "#94a3b8",
  cyan: "#22d3ee",
  amberSoft: "#fff7ed",
  pinkSoft: "#fdf2f8",
  cyanSoft: "#ecfeff",
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const shadow = StyleSheet.create({
  card: {
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 3,
  },
});
