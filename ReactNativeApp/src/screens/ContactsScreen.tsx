import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { contactsApi } from "../api/contactsApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, Contact } from "../types";
import { displayName } from "../utils/format";

type ContactsScreenProps = {
  session: AuthSession;
};

export function ContactsScreen({ session }: ContactsScreenProps) {
  const [items, setItems] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await contactsApi.list(session, {
        search: submittedSearch,
        pageSize: 50,
      });
      setItems(page.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Contacts failed");
    } finally {
      setLoading(false);
    }
  }, [session, submittedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Card>
        <TextField
          autoCapitalize="none"
          label="Search"
          onChangeText={setSearch}
          placeholder="name, email, company"
          value={search}
        />
        <AppButton
          onPress={() => setSubmittedSearch(search.trim())}
          style={styles.searchButton}
          title="Search"
        />
      </Card>

      {error ? <Notice message={error} tone="error" /> : null}

      {items.length ? (
        items.map((contact, index) => <ContactCard contact={contact} key={contact.id || `${contact.email}-${index}`} />)
      ) : (
        <Card>
          <Text style={styles.empty}>No contacts found</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card>
      <Text style={styles.name}>{displayName(contact.first_name, contact.last_name, contact.email || "Contact")}</Text>
      <Text style={styles.email}>{contact.email || ""}</Text>
      {contact.company ? <Text style={styles.company}>{contact.company}</Text> : null}
      {contact.tags?.length ? (
        <View style={styles.tags}>
          {contact.tags.slice(0, 4).map((tag) => (
            <Text key={tag.id} style={styles.tag}>{tag.tag_name || "Tag"}</Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 12,
    padding: 16,
  },
  searchButton: {
    marginTop: 12,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  company: {
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#eff6ff",
    borderRadius: radii.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
});
