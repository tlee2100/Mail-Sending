import { StyleSheet, Text, TextInput, TextInputProps, TextStyle, View } from "react-native";

import { colors, radii } from "../theme";

type TextFieldProps = TextInputProps & {
  label: string;
  labelStyle?: TextStyle;
};

export function TextField({ label, labelStyle, style, multiline, ...props }: TextFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});
