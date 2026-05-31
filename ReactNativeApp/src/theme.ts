import { StyleSheet } from "react-native";

export const colors = {
  background: "#eef2f7",
  surface: "#ffffff",
  surfaceSoft: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#e11d48",
  dark: "#020617",
  darkMuted: "#94a3b8",
  cyan: "#22d3ee",
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const shadow = StyleSheet.create({
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
});
