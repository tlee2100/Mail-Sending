import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { templatesApi } from "../api/templatesApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, EmailTemplate } from "../types";

type EmailTemplatesScreenProps = {
  session: AuthSession;
  onOpenDesigner: (templateId?: number) => void;
};

function ownerText(item: EmailTemplate) {
  if (item.owner_name || item.owner_email) {
    return item.user_id ? `Shared by ${item.owner_name || item.owner_email}` : "Shared template";
  }
  return "Owned by you";
}

export function EmailTemplatesScreen({ session, onOpenDesigner }: EmailTemplatesScreenProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sharedTemplates, setSharedTemplates] = useState<EmailTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return templates;
    }
    return templates.filter((item) =>
      [item.template_name, item.subject, item.preview_text]
        .some((value) => String(value || "").toLowerCase().includes(needle)),
    );
  }, [query, templates]);

  const filteredSharedTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return sharedTemplates;
    }
    return sharedTemplates.filter((item) =>
      [item.template_name, item.subject, item.preview_text]
        .some((value) => String(value || "").toLowerCase().includes(needle)),
    );
  }, [query, sharedTemplates]);

  const activeCount = useMemo(() => templates.filter((item) => item.is_active !== false).length, [templates]);
  const latestTemplate = templates[0];

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const [page, sharedPage] = await Promise.all([
        templatesApi.list(session, { pageSize: 100 }),
        templatesApi.listShared(session, { pageSize: 100, isActive: true }),
      ]);
      setTemplates(page.items || []);
      setSharedTemplates(sharedPage.items || []);
    } catch (error) {
      Alert.alert("Templates failed", error instanceof Error ? error.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  function resetForm() {
    setEditingId(null);
    setTemplateName("");
    setSubject("");
    setPreviewText("");
    setIsActive(true);
  }

  async function editTemplate(item: EmailTemplate) {
    try {
      const detail = await templatesApi.get(session, item.id);
      setEditingId(detail.id);
      setTemplateName(detail.template_name || "");
      setSubject(detail.subject || "");
      setPreviewText(detail.preview_text || "");
      setIsActive(detail.is_active !== false);
    } catch (error) {
      Alert.alert("Template failed", error instanceof Error ? error.message : "Failed to load template");
    }
  }

  async function saveTemplate() {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      Alert.alert("Missing info", "Template name is required.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        templateName: trimmedName,
        subject: subject.trim() || undefined,
        previewText: previewText.trim() || undefined,
        isActive,
      };
      const template = editingId
        ? await templatesApi.update(session, editingId, body)
        : await templatesApi.create(session, {
            ...body,
            contentHtml: "<p>Hello {{name}},</p>",
            contentText: "Hello {{name}},",
          });

      Alert.alert("Template saved", editingId ? "Template updated." : "Template created.");
      resetForm();
      await loadTemplates();
      if (!editingId && template.id) {
        onOpenDesigner(template.id);
      }
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(item: EmailTemplate) {
    Alert.alert("Delete template", `Delete ${item.template_name || "this template"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await templatesApi.delete(session, item.id);
            await loadTemplates();
          } catch (error) {
            Alert.alert("Delete failed", error instanceof Error ? error.message : "Failed to delete template");
          }
        },
      },
    ]);
  }

  async function copySharedTemplate(item: EmailTemplate) {
    setSaving(true);
    try {
      const detail = await templatesApi.get(session, item.id);
      const copy = await templatesApi.create(session, {
        templateName: `${detail.template_name || "Shared Template"} (Copy)`,
        subject: detail.subject || undefined,
        previewText: detail.preview_text || undefined,
        contentHtml: detail.content_html || "<p>Hello {{name}},</p>",
        contentText: detail.content_text || "Hello {{name}},",
        isActive: true,
      });
      await loadTemplates();
      onOpenDesigner(copy.id);
    } catch (error) {
      Alert.alert("Copy failed", error instanceof Error ? error.message : "Failed to copy shared template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTemplates} />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Template Library</Text>
        <Text style={styles.title}>Saved Email Templates</Text>
        <Text style={styles.subtitle}>Create, edit, delete and open templates in Designer.</Text>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, styles.blueStat]}>
          <Text style={styles.statIcon}>Tpl</Text>
          <Text style={styles.statValue}>{templates.length}</Text>
          <Text style={styles.statLabel}>Total Templates</Text>
        </View>
        <View style={[styles.statCard, styles.greenStat]}>
          <Text style={styles.statIcon}>Act</Text>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Templates</Text>
        </View>
        <View style={[styles.statCard, styles.cyanStat]}>
          <Text style={styles.statIcon}>Shr</Text>
          <Text style={styles.statValue}>{sharedTemplates.length}</Text>
          <Text style={styles.statLabel}>Shared</Text>
        </View>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? "Edit Template" : "Create in Designer"}</Text>
        <TextField label="Template name" onChangeText={setTemplateName} value={templateName} />
        <TextField label="Subject" onChangeText={setSubject} value={subject} />
        <TextField label="Preview text" onChangeText={setPreviewText} value={previewText} />
        <AppButton
          onPress={() => setIsActive((value) => !value)}
          title={isActive ? "Active Template" : "Inactive Template"}
          variant="secondary"
        />
        <View style={styles.actions}>
          <AppButton loading={saving} onPress={saveTemplate} title={editingId ? "Save Changes" : "Create & Design"} />
          {editingId ? <AppButton onPress={resetForm} title="Cancel Edit" variant="secondary" /> : null}
        </View>
      </Card>

      <TextField label="Find" onChangeText={setQuery} placeholder="Search templates..." value={query} />

      {latestTemplate ? (
        <Card style={styles.latestCard}>
          <Text style={styles.latestLabel}>Latest Template</Text>
          <Text style={styles.latestName}>{latestTemplate.template_name}</Text>
        </Card>
      ) : null}

      <Text style={styles.listTitle}>Your Templates</Text>

      {filteredTemplates.length ? (
        filteredTemplates.map((item) => (
          <Card key={item.id} style={styles.templateCard}>
            <View style={styles.templateTop}>
              <Text style={styles.templateName}>{item.template_name || "Template"}</Text>
              <Text style={[styles.status, item.is_active === false && styles.inactiveStatus]}>
                {item.is_active === false ? "Inactive" : "Active"}
              </Text>
            </View>
            <Text style={styles.owner}>{ownerText(item)}</Text>
            <Text style={styles.subject}>{item.subject || "No subject"}</Text>
            <Text style={styles.preview}>{item.preview_text || "No preview text"}</Text>
            <View style={styles.actions}>
              <AppButton onPress={() => onOpenDesigner(item.id)} title="Designer" />
              <AppButton onPress={() => void editTemplate(item)} title="Edit" variant="secondary" />
              <AppButton onPress={() => void deleteTemplate(item)} title="Delete" variant="danger" />
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.sectionTitle}>No templates found.</Text>
          <Text style={styles.subtitle}>Create a template, then open it in Designer for block editing.</Text>
        </Card>
      )}

      <Text style={styles.listTitle}>Shared Templates</Text>

      {filteredSharedTemplates.length ? (
        filteredSharedTemplates.map((item) => (
          <Card key={`shared-${item.id}`} style={styles.templateCard}>
            <View style={styles.templateTop}>
              <Text style={styles.templateName}>{item.template_name || "Shared Template"}</Text>
              <Text style={styles.sharedStatus}>Shared</Text>
            </View>
            <Text style={styles.owner}>{ownerText(item)}</Text>
            <Text style={styles.subject}>{item.subject || "No subject"}</Text>
            <Text style={styles.preview}>{item.preview_text || "No preview text"}</Text>
            <View style={styles.actions}>
              <AppButton loading={saving} onPress={() => void copySharedTemplate(item)} title="Copy & Design" />
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.sectionTitle}>No shared templates found.</Text>
          <Text style={styles.subtitle}>Shared templates from admin will appear here when the backend returns them.</Text>
        </Card>
      )}
    </ScrollView>
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
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    borderRadius: radii.lg,
    flex: 1,
    gap: 7,
    padding: 18,
  },
  blueStat: {
    backgroundColor: colors.primary,
  },
  greenStat: {
    backgroundColor: colors.success,
  },
  cyanStat: {
    backgroundColor: "#0891b2",
  },
  statIcon: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  statValue: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  formCard: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  listTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  actions: {
    gap: 10,
  },
  latestCard: {
    backgroundColor: colors.cyanSoft,
    borderColor: "#67e8f9",
  },
  latestLabel: {
    color: "#0e7490",
    fontSize: 12,
    fontWeight: "900",
  },
  latestName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  templateCard: {
    borderColor: "#dbe4ff",
    gap: 10,
  },
  templateTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  templateName: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  status: {
    backgroundColor: "#dcfce7",
    borderRadius: radii.pill,
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inactiveStatus: {
    backgroundColor: colors.border,
    color: colors.muted,
  },
  sharedStatus: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  owner: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  subject: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  preview: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: colors.surfaceSoft,
    gap: 8,
  },
});
