import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { contactsApi } from "../api/contactsApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { Notice } from "../components/Notice";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, Contact, ContactTag } from "../types";
import { displayName, formatNumber } from "../utils/format";

type TagsScreenProps = {
  session: AuthSession;
};

type ModalMode = "form" | "contacts" | "";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

export function TagsScreen({ session }: TagsScreenProps) {
  const [items, setItems] = useState<ContactTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ModalMode>("");
  const [editingTag, setEditingTag] = useState<ContactTag | null>(null);
  const [tagName, setTagName] = useState("");
  const [color, setColor] = useState(colors.primary);
  const [tagContacts, setTagContacts] = useState<Contact[]>([]);

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

  function openCreateModal() {
    setEditingTag(null);
    setTagName("");
    setColor(colors.primary);
    setMode("form");
  }

  function openEditModal(tag: ContactTag) {
    setEditingTag(tag);
    setTagName(tag.tag_name || "");
    setColor(tag.color || colors.primary);
    setMode("form");
  }

  function closeModal() {
    setMode("");
    setEditingTag(null);
    setTagContacts([]);
  }

  async function saveTag() {
    if (!tagName.trim()) {
      Alert.alert("Missing info", "Tag name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingTag) {
        await contactsApi.updateTag(session, editingTag.id, { tagName: tagName.trim(), color });
      } else {
        await contactsApi.createTag(session, { tagName: tagName.trim(), color });
      }
      closeModal();
      await load();
    } catch (nextError) {
      Alert.alert("Save failed", nextError instanceof Error ? nextError.message : "Failed to save tag");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTag(tag: ContactTag) {
    Alert.alert("Delete tag", `Delete ${tag.tag_name || "this tag"}? Contacts will not be deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await contactsApi.deleteTag(session, tag.id);
            await load();
          } catch (nextError) {
            Alert.alert("Delete failed", nextError instanceof Error ? nextError.message : "Failed to delete tag");
          }
        },
      },
    ]);
  }

  async function viewContacts(tag: ContactTag) {
    setEditingTag(tag);
    setMode("contacts");
    try {
      const data = await contactsApi.listTagRecipients(session, tag.id);
      setTagContacts(data.recipients || []);
    } catch (nextError) {
      Alert.alert("Contacts failed", nextError instanceof Error ? nextError.message : "Failed to load tag contacts");
    }
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Audience labels</Text>
          <Text style={styles.title}>Contact Tags</Text>
          <Text style={styles.subtitle}>Create, edit and organize contact audience tags.</Text>
        </View>

        <AppButton onPress={openCreateModal} title="+ Create Tag" />

        {error ? <Notice message={error} tone="error" /> : null}
        {items.length ? (
          <View style={styles.grid}>
            {items.map((tag) => (
              <TagCard
                key={tag.id}
                onDelete={() => void deleteTag(tag)}
                onEdit={() => openEditModal(tag)}
                onViewContacts={() => void viewContacts(tag)}
                tag={tag}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.sectionTitle}>No tags found</Text>
            <Text style={styles.subtitle}>Create your first backend tag to organize contacts.</Text>
            <AppButton onPress={openCreateModal} title="+ Create Tag" />
          </Card>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={Boolean(mode)} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.eyebrow}>{mode === "contacts" ? "Tag contacts" : editingTag ? "Edit tag" : "New tag"}</Text>
                <Text style={styles.modalTitle}>{mode === "contacts" ? editingTag?.tag_name || "Contacts" : editingTag ? "Update contact tag" : "Create contact tag"}</Text>
                <Text style={styles.subtitle}>{mode === "contacts" ? "Contacts in this audience segment." : "Use tags to segment contacts before sending campaigns."}</Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeText}>x</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {mode === "form" ? (
                <>
                  <TextField label="Tag name *" onChangeText={setTagName} placeholder="VIP" value={tagName} />
                  <TextField label="Color" onChangeText={setColor} placeholder="#5b4ff2" value={color} />
                  <View style={styles.previewStrip}>
                    <Text style={[styles.tagBadge, { color }]}>{tagName || "Preview tag"}</Text>
                    <View style={[styles.tagDot, { backgroundColor: color }]} />
                  </View>
                  <View style={styles.actions}>
                    <AppButton onPress={closeModal} style={styles.actionButton} title="Cancel" variant="secondary" />
                    <AppButton loading={saving} onPress={() => void saveTag()} style={styles.actionButton} title={editingTag ? "Save changes" : "Create tag"} />
                  </View>
                </>
              ) : null}

              {mode === "contacts" ? (
                tagContacts.length ? tagContacts.map((contact, index) => (
                  <View key={contact.id || `${contact.email}-${index}`} style={styles.contactRow}>
                    <Text style={styles.contactName}>{displayName(contact.first_name, contact.last_name, contact.email || "Contact")}</Text>
                    <Text style={styles.subtitle}>{contact.email || "-"}</Text>
                  </View>
                )) : <Text style={styles.empty}>No contacts in this tag.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function TagCard({ onDelete, onEdit, onViewContacts, tag }: { onDelete: () => void; onEdit: () => void; onViewContacts: () => void; tag: ContactTag }) {
  const tagColor = tag.color || colors.primary;
  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={[styles.tagBadge, { color: tagColor }]}>{tag.tag_name || "Tag"}</Text>
        <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
      </View>
      <Text style={styles.name}>{tag.tag_name || "Tag"}</Text>
      <Text style={styles.count}>{formatNumber(tag.contact_count)}</Text>
      <Text style={styles.subtitle}>Contacts in this audience segment</Text>
      <Text style={styles.meta}>Created {formatDate(tag.created_at)}</Text>
      <View style={styles.actions}>
        <AppButton onPress={onViewContacts} style={styles.actionButton} title="View Contacts" variant="secondary" />
        <AppButton onPress={onEdit} style={styles.actionButton} title="Edit" variant="secondary" />
        <AppButton onPress={onDelete} style={styles.actionButton} title="Delete" variant="danger" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    gap: 6,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  grid: {
    gap: 16,
  },
  card: {
    gap: 10,
    padding: 18,
  },
  cardHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tagBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagDot: {
    borderRadius: 999,
    height: 18,
    width: 18,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  count: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    minHeight: 42,
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  modalBackdrop: {
    backgroundColor: "rgba(15,23,42,0.7)",
    flex: 1,
    justifyContent: "center",
    padding: 14,
  },
  modal: {
    backgroundColor: colors.surface,
    borderColor: "#c7d2fe",
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "92%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: "#c7d2fe",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  modalBody: {
    gap: 12,
    paddingBottom: 6,
  },
  previewStrip: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  contactRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 3,
    paddingBottom: 10,
  },
  contactName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
});
