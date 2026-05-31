import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { contactsApi } from "../api/contactsApi";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { colors, radii } from "../theme";
import type { AuthSession, ContactTag } from "../types";
import { formatNumber } from "../utils/format";

type TagsScreenProps = {
  session: AuthSession;
};

export function TagsScreen({ session }: TagsScreenProps) {
  const [items, setItems] = useState<ContactTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await contactsApi.listTags(session));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Tags failed");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {error ? <Notice message={error} tone="error" /> : null}
      {items.length ? (
        <View style={styles.grid}>
          {items.map((tag) => <TagCard key={tag.id} tag={tag} />)}
        </View>
      ) : (
        <Card>
          <Text style={styles.empty}>No tags yet</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function TagCard({ tag }: { tag: ContactTag }) {
  return (
    <Card style={styles.card}>
      <View style={[styles.swatch, { backgroundColor: tag.color || colors.primary }]} />
      <Text style={styles.name}>{tag.tag_name || "Tag"}</Text>
      <Text style={styles.count}>{formatNumber(tag.contact_count)} contacts</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    minHeight: 130,
    width: "47.5%",
  },
  swatch: {
    borderRadius: radii.md,
    height: 30,
    marginBottom: 16,
    width: 30,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  count: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
});
