import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { contactsApi } from "../api/contactsApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { ChoiceList } from "../components/ChoiceList";
import { Notice } from "../components/Notice";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, Contact, ContactField, ContactTag } from "../types";
import { displayName } from "../utils/format";

type ContactsScreenProps = {
  session: AuthSession;
};

type ContactMode = "create" | "edit" | "tags" | "fields" | "";

const statusOptions = [
  { id: "", label: "All Status" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "unsubscribed", label: "Unsubscribed" },
  { id: "bounced", label: "Bounced" },
  { id: "blocked", label: "Blocked" },
];

function ownerText(contact: Contact) {
  if (contact.owner_name || contact.owner_email) return `${contact.owner_name || "Owner"} (${contact.owner_email || "no email"})`;
  if (contact.user_id) return `User #${contact.user_id}`;
  return "Owned by you";
}

function emptyContactForm() {
  return {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    city: "",
    country: "",
    emailStatus: "active",
    source: "manual",
  };
}

export function ContactsScreen({ session }: ContactsScreenProps) {
  const [items, setItems] = useState<Contact[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tagId, setTagId] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ContactMode>("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyContactForm());
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [fields, setFields] = useState<ContactField[]>([]);

  const tagChoices = useMemo(
    () => [{ id: 0, label: "All Tags" }, ...tags.map((tag) => ({ id: tag.id, label: `${tag.tag_name || "Tag"} (${tag.contact_count || 0})` }))],
    [tags],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [page, tagRows] = await Promise.all([
        contactsApi.list(session, {
          search: submittedSearch,
          status,
          city: submittedCity,
          tagId: tagId || undefined,
          pageSize: 50,
        }),
        contactsApi.listTags(session),
      ]);
      setItems(page.items || []);
      setTags(tagRows || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Contacts failed");
    } finally {
      setLoading(false);
    }
  }, [session, status, submittedCity, submittedSearch, tagId]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setSearch("");
    setSubmittedSearch("");
    setStatus("");
    setTagId(null);
    setCity("");
    setSubmittedCity("");
  }

  function openCreateContactModal() {
    setSelectedContact(null);
    setForm(emptyContactForm());
    setMode("create");
  }

  function openEditContactModal(contact: Contact) {
    setSelectedContact(contact);
    setForm({
      email: contact.email || "",
      firstName: contact.first_name || "",
      lastName: contact.last_name || "",
      phone: contact.phone || "",
      company: contact.company || "",
      city: contact.city || "",
      country: contact.country || "",
      emailStatus: contact.email_status || "active",
      source: contact.source || "manual",
    });
    setMode("edit");
  }

  function openTagManager(contact: Contact) {
    setSelectedContact(contact);
    setSelectedTagIds((contact.tags || []).map((tag) => tag.id));
    setMode("tags");
  }

  async function openFields(contact: Contact) {
    if (!contact.id) return;
    setSelectedContact(contact);
    setMode("fields");
    try {
      setFields(await contactsApi.listContactFields(session, contact.id));
    } catch (nextError) {
      Alert.alert("Fields failed", nextError instanceof Error ? nextError.message : "Failed to load fields");
    }
  }

  function closeModal() {
    setMode("");
    setSelectedContact(null);
    setSelectedTagIds([]);
    setFields([]);
  }

  async function saveContact() {
    if (!form.email.trim()) {
      Alert.alert("Missing info", "Email is required.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        email: form.email.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        emailStatus: form.emailStatus,
        source: form.source.trim() || undefined,
      };
      if (mode === "edit" && selectedContact?.id) await contactsApi.update(session, selectedContact.id, body);
      else await contactsApi.create(session, body);
      closeModal();
      await load();
    } catch (nextError) {
      Alert.alert("Save failed", nextError instanceof Error ? nextError.message : "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  async function saveContactTags() {
    if (!selectedContact?.id) return;
    setSaving(true);
    try {
      await contactsApi.replaceContactTags(session, selectedContact.id, selectedTagIds);
      closeModal();
      await load();
    } catch (nextError) {
      Alert.alert("Tags failed", nextError instanceof Error ? nextError.message : "Failed to save tags");
    } finally {
      setSaving(false);
    }
  }

  async function saveFields() {
    if (!selectedContact?.id) return;
    setSaving(true);
    try {
      await contactsApi.replaceContactFields(
        session,
        selectedContact.id,
        fields.map((field) => ({ fieldId: field.id, value: field.value ?? null })),
      );
      closeModal();
    } catch (nextError) {
      Alert.alert("Fields failed", nextError instanceof Error ? nextError.message : "Failed to save fields");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact(contact: Contact) {
    if (!contact.id) return;
    Alert.alert("Delete contact", `Delete ${displayName(contact.first_name, contact.last_name, contact.email || "Contact")}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await contactsApi.delete(session, contact.id!);
            await load();
          } catch (nextError) {
            Alert.alert("Delete failed", nextError instanceof Error ? nextError.message : "Failed to delete contact");
          }
        },
      },
    ]);
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Email Contacts</Text>
          <Text style={styles.subtitle}>Live contact list from backend</Text>
        </View>

        <View style={styles.headerButtons}>
          <AppButton onPress={() => Alert.alert("Import / Export", "Mobile import/export needs a file picker. Use web for bulk files for now.")} title="Import / Export" variant="secondary" />
          <AppButton onPress={() => Alert.alert("Fields", "Open Fields on each contact to edit dynamic values.")} title="Fields" variant="secondary" />
          <AppButton onPress={openCreateContactModal} title="+ Add Contact" />
        </View>

        <Card style={styles.filterCard}>
          <TextField autoCapitalize="none" label="Find" onChangeText={setSearch} placeholder="Search contacts..." value={search} />
          <ChoiceList emptyText="No statuses" getId={(item) => item.id} getLabel={(item) => item.label} items={statusOptions} onSelect={(item) => setStatus(item.id)} selectedId={status} />
          <ChoiceList emptyText="No tags" getId={(item) => item.id} getLabel={(item) => item.label} items={tagChoices} onSelect={(item) => setTagId(item.id || null)} selectedId={tagId || 0} />
          <TextField label="City" onChangeText={setCity} placeholder="City" value={city} />
          <AppButton onPress={() => { setSubmittedSearch(search.trim()); setSubmittedCity(city.trim()); }} title="Filter" />
          <AppButton onPress={clearFilters} title="Clear" variant="secondary" />
        </Card>

        {error ? <Notice message={error} tone="error" /> : null}

        <View style={styles.listHead}>
          <Text style={styles.sectionTitle}>Contacts ({items.length})</Text>
          <AppButton onPress={load} style={styles.refreshButton} title="Refresh" variant="secondary" />
        </View>

        {items.length ? (
          items.map((contact, index) => (
            <ContactCard
              contact={contact}
              key={contact.id || `${contact.email}-${index}`}
              onDelete={() => void deleteContact(contact)}
              onEdit={() => openEditContactModal(contact)}
              onFields={() => void openFields(contact)}
              onTags={() => openTagManager(contact)}
            />
          ))
        ) : (
          <Card>
            <Text style={styles.empty}>No Contacts Found</Text>
            <Text style={styles.subtitle}>Create a contact or adjust filters.</Text>
          </Card>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={Boolean(mode)} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.eyebrow}>{mode === "edit" ? "Edit contact" : mode === "tags" ? "Manage tags" : mode === "fields" ? "Contact fields" : "New contact"}</Text>
                <Text style={styles.modalTitle}>{mode === "edit" ? "Update contact" : mode === "tags" ? "Manage Tags" : mode === "fields" ? "Fields" : "Add contact"}</Text>
                <Text style={styles.subtitle}>{selectedContact ? displayName(selectedContact.first_name, selectedContact.last_name, selectedContact.email || "Contact") : "Manage recipient profile data used for merge tags."}</Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeText}>x</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {(mode === "create" || mode === "edit") ? (
                <>
                  <TextField autoCapitalize="none" keyboardType="email-address" label="Email *" onChangeText={(value) => setForm({ ...form, email: value })} value={form.email} />
                  <View style={styles.row}>
                    <TextField label="First name" onChangeText={(value) => setForm({ ...form, firstName: value })} style={styles.rowInput} value={form.firstName} />
                    <TextField label="Last name" onChangeText={(value) => setForm({ ...form, lastName: value })} style={styles.rowInput} value={form.lastName} />
                  </View>
                  <TextField label="Phone" onChangeText={(value) => setForm({ ...form, phone: value })} value={form.phone} />
                  <TextField label="Company" onChangeText={(value) => setForm({ ...form, company: value })} value={form.company} />
                  <View style={styles.row}>
                    <TextField label="City" onChangeText={(value) => setForm({ ...form, city: value })} style={styles.rowInput} value={form.city} />
                    <TextField label="Country" onChangeText={(value) => setForm({ ...form, country: value })} style={styles.rowInput} value={form.country} />
                  </View>
                  <ChoiceList emptyText="No statuses" getId={(item) => item.id} getLabel={(item) => item.label} items={statusOptions.slice(1)} onSelect={(item) => setForm({ ...form, emailStatus: item.id })} selectedId={form.emailStatus} />
                  <TextField label="Source" onChangeText={(value) => setForm({ ...form, source: value })} value={form.source} />
                  <View style={styles.actions}>
                    <AppButton onPress={closeModal} style={styles.actionButton} title="Cancel" variant="secondary" />
                    <AppButton loading={saving} onPress={() => void saveContact()} style={styles.actionButton} title={mode === "edit" ? "Save changes" : "Create contact"} />
                  </View>
                </>
              ) : null}

              {mode === "tags" ? (
                <>
                  {tags.length ? tags.map((tag) => {
                    const checked = selectedTagIds.includes(tag.id);
                    return (
                      <Pressable key={tag.id} onPress={() => setSelectedTagIds(checked ? selectedTagIds.filter((id) => id !== tag.id) : [...selectedTagIds, tag.id])} style={[styles.tagOption, checked && styles.tagOptionActive]}>
                        <Text style={[styles.tagBadge, { color: tag.color || colors.primary }]}>{tag.tag_name || "Tag"}</Text>
                        <Text style={styles.subtitle}>{tag.contact_count || 0} contacts</Text>
                      </Pressable>
                    );
                  }) : <Text style={styles.empty}>Create tags first before assigning contacts.</Text>}
                  <View style={styles.actions}>
                    <AppButton onPress={closeModal} style={styles.actionButton} title="Cancel" variant="secondary" />
                    <AppButton loading={saving} onPress={() => void saveContactTags()} style={styles.actionButton} title="Save Tags" />
                  </View>
                </>
              ) : null}

              {mode === "fields" ? (
                <>
                  {fields.length ? fields.map((field) => (
                    <TextField
                      key={field.id}
                      label={field.field_label || field.field_name || `Field #${field.id}`}
                      onChangeText={(value) => setFields(fields.map((item) => item.id === field.id ? { ...item, value } : item))}
                      value={String(field.value ?? "")}
                    />
                  )) : <Text style={styles.empty}>No dynamic fields for this contact.</Text>}
                  <View style={styles.actions}>
                    <AppButton onPress={closeModal} style={styles.actionButton} title="Cancel" variant="secondary" />
                    <AppButton loading={saving} onPress={() => void saveFields()} style={styles.actionButton} title="Save Fields" />
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ContactCard({ contact, onDelete, onEdit, onFields, onTags }: { contact: Contact; onDelete: () => void; onEdit: () => void; onFields: () => void; onTags: () => void }) {
  return (
    <Card style={styles.contactCard}>
      <Text style={styles.name}>{displayName(contact.first_name, contact.last_name, contact.email || "Contact")}</Text>
      <InfoRow label="Email" value={contact.email || "-"} />
      <InfoRow label="Status" value={contact.email_status || "active"} />
      <InfoRow label="Owner" value={ownerText(contact)} />
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Tags</Text>
        <View style={styles.tags}>
          {contact.tags?.length ? contact.tags.map((tag) => (
            <Text key={tag.id} style={[styles.tag, { color: tag.color || colors.primary }]}>{tag.tag_name || "Tag"}</Text>
          )) : <Text style={styles.infoValue}>No tags</Text>}
        </View>
      </View>
      <InfoRow label="Company" value={contact.company || "-"} />
      <InfoRow label="City" value={contact.city || "-"} />
      <View style={styles.actions}>
        <AppButton onPress={onEdit} style={styles.actionButton} title="Edit" variant="secondary" />
        <AppButton onPress={onTags} style={styles.actionButton} title="Tags" variant="secondary" />
        <AppButton onPress={onFields} style={styles.actionButton} title="Fields" variant="secondary" />
        <AppButton onPress={onDelete} style={styles.actionButton} title="Delete" variant="danger" />
      </View>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    gap: 6,
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
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  headerButtons: {
    gap: 8,
  },
  filterCard: {
    gap: 12,
  },
  listHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  refreshButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  contactCard: {
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  infoRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 8,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  infoValue: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    textAlign: "right",
  },
  tags: {
    alignItems: "flex-end",
    flex: 1,
    gap: 4,
  },
  tag: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    minWidth: 120,
    paddingHorizontal: 10,
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
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    minWidth: 0,
  },
  tagOption: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  tagOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  tagBadge: {
    fontSize: 14,
    fontWeight: "900",
  },
});
