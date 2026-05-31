import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, radii } from "../theme";

type ChoiceListProps<T> = {
  items: T[];
  selectedId?: number | string | null;
  emptyText: string;
  getId: (item: T) => number | string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
};

export function ChoiceList<T>({
  items,
  selectedId,
  emptyText,
  getId,
  getLabel,
  onSelect,
}: ChoiceListProps<T>) {
  if (!items.length) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const id = getId(item);
        const selected = String(id) === String(selectedId);
        return (
          <TouchableOpacity
            key={String(id)}
            activeOpacity={0.75}
            onPress={() => onSelect(item)}
            style={[styles.chip, selected && styles.selectedChip]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{getLabel(item)}</Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.endSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectedLabel: {
    color: colors.surface,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 8,
  },
  endSpacer: {
    width: 4,
  },
});
