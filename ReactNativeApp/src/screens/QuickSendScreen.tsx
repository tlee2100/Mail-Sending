import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { contactsApi } from "../api/contactsApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { individualEmailsApi } from "../api/individualEmailsApi";
import { templatesApi } from "../api/templatesApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { ChoiceList } from "../components/ChoiceList";
import { Notice } from "../components/Notice";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, ContactTag, EmailAccount, EmailTemplate } from "../types";
import { parseRecipientText } from "../utils/format";

type QuickSendScreenProps = {
  session: AuthSession;
};

type RecipientMode = "single" | "list" | "tag";
type DesignerBlockType = "text" | "button" | "image" | "divider" | "html";
type DesignerBlock = {
  id: string;
  type: DesignerBlockType;
  label: string;
  content: string;
  url?: string;
  color: string;
  backgroundColor: string;
  fontSize: string;
  align: "left" | "center" | "right";
};

const mergeTags = ["{{name}}", "{{email}}", "{{company}}", "{{unsubscribe_url}}"];
const designerBlockTypes: Array<{ type: DesignerBlockType; label: string; short: string }> = [
  { type: "text", label: "Text", short: "Tx" },
  { type: "button", label: "Button", short: "Bt" },
  { type: "image", label: "Image", short: "Im" },
  { type: "divider", label: "Divider", short: "Dv" },
  { type: "html", label: "HTML", short: "HT" },
];
const alignmentOptions: DesignerBlock["align"][] = ["left", "center", "right"];

const editorActions = [
  { label: "B", insert: "<strong>important text</strong>" },
  { label: "I", insert: "<em>emphasized text</em>" },
  { label: "H2", insert: "<h2>Your headline</h2>" },
  { label: "CTA", insert: '<a href="https://example.com">Call to action</a>' },
  { label: "List", insert: "<ul>\n  <li>First point</li>\n  <li>Second point</li>\n</ul>" },
];

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(value?: string) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHtmlContent(value: string, templateHtml?: string) {
  if (hasHtml(value)) {
    return value;
  }

  if (templateHtml?.trim()) {
    return templateHtml.trim();
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function createDesignerBlock(type: DesignerBlockType): DesignerBlock {
  const base = {
    id: `${type}-${Date.now()}`,
    type,
    color: "#0f172a",
    backgroundColor: "#2563eb",
    fontSize: type === "text" ? "16" : "14",
    align: "left" as const,
  };

  if (type === "button") {
    return {
      ...base,
      label: "Button",
      content: "Call to action",
      url: "https://example.com",
      color: "#ffffff",
      align: "center",
    };
  }

  if (type === "image") {
    return {
      ...base,
      label: "Image",
      content: "Image alt text",
      url: "https://via.placeholder.com/640x320.png?text=ChadMailer",
      align: "center",
    };
  }

  if (type === "divider") {
    return {
      ...base,
      label: "Divider",
      content: "",
      color: "#e2e8f0",
    };
  }

  if (type === "html") {
    return {
      ...base,
      label: "HTML",
      content: "<p>Custom HTML block</p>",
    };
  }

  return {
    ...base,
    label: "Text",
    content: "Xin chào {{name}},\n\nWrite your message here.",
  };
}

function blockToHtml(block: DesignerBlock) {
  const align = block.align;
  const fontSize = Number.parseInt(block.fontSize, 10) || 16;

  if (block.type === "button") {
    return `<p style="text-align:${align};"><a href="${escapeHtml(block.url || "#")}" style="display:inline-block;background:${escapeHtml(block.backgroundColor)};color:${escapeHtml(block.color)};padding:12px 18px;border-radius:10px;text-decoration:none;font-size:${fontSize}px;font-weight:700;">${escapeHtml(block.content)}</a></p>`;
  }

  if (block.type === "image") {
    return `<p style="text-align:${align};"><img src="${escapeHtml(block.url || "")}" alt="${escapeHtml(block.content)}" style="max-width:100%;height:auto;border-radius:12px;" /></p>`;
  }

  if (block.type === "divider") {
    return `<hr style="border:none;border-top:1px solid ${escapeHtml(block.color)};margin:20px 0;" />`;
  }

  if (block.type === "html") {
    return block.content;
  }

  return block.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="text-align:${align};color:${escapeHtml(block.color)};font-size:${fontSize}px;line-height:1.55;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n");
}

function blockToText(block: DesignerBlock) {
  if (block.type === "button") {
    return `${block.content}\n${block.url || ""}`.trim();
  }

  if (block.type === "image" || block.type === "divider") {
    return "";
  }

  return stripHtml(block.content);
}

export function QuickSendScreen({ session }: QuickSendScreenProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("single");
  const [singleRecipient, setSingleRecipient] = useState("");
  const [previewEmail, setPreviewEmail] = useState(session.email);
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("Hi {{name}},\n\nWrite your message here.\n\nBest regards,\nChadMailer");
  const [templateHtml, setTemplateHtml] = useState("");
  const [designerOpen, setDesignerOpen] = useState(false);
  const [designerBlocks, setDesignerBlocks] = useState<DesignerBlock[]>([
    createDesignerBlock("text"),
    createDesignerBlock("button"),
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [sending, setSending] = useState<"preview" | "send" | "">("");
  const [error, setError] = useState("");

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const recipientText = recipientMode === "single" ? singleRecipient : recipients;
  const parsedRecipients = useMemo(() => parseRecipientText(recipientText), [recipientText]);
  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );
  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );
  const selectedBlock = useMemo(
    () => designerBlocks.find((block) => block.id === selectedBlockId) || designerBlocks[0] || null,
    [designerBlocks, selectedBlockId],
  );
  const designerHtml = useMemo(
    () => designerBlocks.map(blockToHtml).join("\n"),
    [designerBlocks],
  );
  const designerText = useMemo(
    () => designerBlocks.map(blockToText).filter(Boolean).join("\n\n"),
    [designerBlocks],
  );

  const loadLookups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountList, templatePage, tagList] = await Promise.all([
        emailAccountsApi.list(session),
        templatesApi.listActive(session),
        contactsApi.listTags(session),
      ]);

      setAccounts(accountList);
      setTemplates(templatePage.items || []);
      setTags(tagList);

      setSelectedAccountId((current) => current || accountList.find((item) => item.is_default)?.id || accountList[0]?.id || null);
      setSelectedTagId((current) => current || tagList[0]?.id || null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load compose form");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  async function applyTemplate() {
    if (!selectedTemplateId) {
      Alert.alert("No template selected", "Choose a template first.");
      return;
    }

    setTemplateLoading(true);
    try {
      const template = await templatesApi.get(session, selectedTemplateId);
      setSubject(template.subject || template.template_name || "");
      setContent(template.content_text || stripHtml(template.content_html) || template.preview_text || "");
      setTemplateHtml(template.content_html || "");
      Alert.alert("Template loaded", `Loaded ${template.template_name || "selected template"}.`);
    } catch (nextError) {
      Alert.alert("Template failed", nextError instanceof Error ? nextError.message : "Template detail failed");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function loadTagRecipients() {
    if (!selectedTagId) {
      Alert.alert("No tag selected", "Choose a tag first.");
      return;
    }

    setLoading(true);
    try {
      const result = await contactsApi.listTagRecipients(session, selectedTagId);
      const emails = (result.recipients || [])
        .map((item) => item.email)
        .filter((email): email is string => Boolean(email));
      setRecipients(emails.join("\n"));
      setRecipientMode("tag");
      Alert.alert("Recipients loaded", `Loaded ${emails.length} recipients.`);
    } catch (nextError) {
      Alert.alert("Load failed", nextError instanceof Error ? nextError.message : "Failed to load recipients");
    } finally {
      setLoading(false);
    }
  }

  function appendContent(value: string) {
    const separator = content.trim() ? "\n\n" : "";
    setContent((current) => `${current}${separator}${value}`);
  }

  function addDesignerBlock(type: DesignerBlockType) {
    const block = createDesignerBlock(type);
    setDesignerBlocks((current) => [...current, block]);
    setSelectedBlockId(block.id);
    setDesignerOpen(true);
  }

  function updateSelectedBlock(patch: Partial<DesignerBlock>) {
    if (!selectedBlock) {
      return;
    }

    setDesignerBlocks((current) =>
      current.map((block) => (block.id === selectedBlock.id ? { ...block, ...patch } : block)),
    );
  }

  function removeSelectedBlock() {
    if (!selectedBlock) {
      return;
    }

    setDesignerBlocks((current) => current.filter((block) => block.id !== selectedBlock.id));
    setSelectedBlockId(null);
  }

  function applyDesignerToEmail() {
    if (!designerBlocks.length) {
      Alert.alert("No blocks", "Add at least one block before applying the design.");
      return;
    }

    setContent(designerText || stripHtml(designerHtml));
    setTemplateHtml(designerHtml);
    Alert.alert("Template Designer", "Design applied to the email composer.");
  }

  function clearComposer() {
    setSelectedTemplateId(null);
    setRecipientMode("single");
    setSingleRecipient("");
    setRecipients("");
    setSubject("");
    setContent("");
    setTemplateHtml("");
    setDesignerBlocks([createDesignerBlock("text"), createDesignerBlock("button")]);
    setSelectedBlockId(null);
  }

  async function send(mode: "preview" | "send") {
    const trimmedSubject = subject.trim();
    const trimmedContent = content.trim();

    if (!selectedAccount?.id) {
      Alert.alert("Missing sender", "Select a sender account first.");
      return;
    }

    if (!trimmedSubject || !trimmedContent) {
      Alert.alert("Missing info", "Subject and content are required.");
      return;
    }

    if (mode === "preview" && !previewEmail.trim()) {
      Alert.alert("Missing preview email", "Enter the email address that should receive the preview.");
      return;
    }

    if (mode === "send" && parsedRecipients.length === 0) {
      Alert.alert("No recipients", "Add at least one recipient before sending.");
      return;
    }

    const baseBody = {
      subject: trimmedSubject,
      content: trimmedContent,
      htmlContent: buildHtmlContent(trimmedContent, templateHtml),
      emailAccountId: selectedAccount.id,
    };

    setSending(mode);
    try {
      const result =
        mode === "preview"
          ? await individualEmailsApi.preview(session, {
              ...baseBody,
              previewEmail: previewEmail.trim(),
            })
          : await individualEmailsApi.send(session, {
              ...baseBody,
              recipients: parsedRecipients,
            });

      Alert.alert("Email result", `Sent ${result.sentCount || 0}, failed ${result.failedCount || 0}.`);
    } catch (nextError) {
      Alert.alert("Send failed", nextError instanceof Error ? nextError.message : "Request failed");
    } finally {
      setSending("");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLookups} />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Individual Mail</Text>
        <Text style={styles.title}>Compose Email</Text>
        <Text style={styles.subtitle}>Build, preview and send one-off emails with templates and merge tags.</Text>
      </View>

      {error ? <Notice message={error} tone="error" /> : null}

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Setup</Text>
            <Text style={styles.sectionHint}>Choose the sending account and optionally load a template.</Text>
          </View>
          <Text style={styles.badge}>{selectedAccount?.provider || "SMTP"}</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Sender</Text>
          <ChoiceList
            emptyText="No sender account"
            getId={(item) => item.id}
            getLabel={(item) => `${item.email_address || "Sender"}${item.is_default ? " (default)" : ""}`}
            items={accounts}
            onSelect={(item) => setSelectedAccountId(item.id)}
            selectedId={selectedAccountId}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Template</Text>
          <ChoiceList
            emptyText="No active template"
            getId={(item) => item.id}
            getLabel={(item) => item.template_name || "Template"}
            items={templates}
            onSelect={(item) => setSelectedTemplateId(item.id)}
            selectedId={selectedTemplateId}
          />
          <AppButton
            disabled={!activeTemplate || templateLoading}
            loading={templateLoading}
            onPress={applyTemplate}
            title="Load Template"
            variant="secondary"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Template Designer</Text>
            <Text style={styles.sectionHint}>Build a mobile email layout with reusable blocks.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDesignerOpen((value) => !value)}
            style={styles.smallCommand}
          >
            <Text style={styles.smallCommandText}>{designerOpen ? "Hide" : "Open"}</Text>
          </Pressable>
        </View>

        {designerOpen ? (
          <View style={styles.designer}>
            <View style={styles.blockLibrary}>
              {designerBlockTypes.map((item) => (
                <Pressable
                  key={item.type}
                  accessibilityRole="button"
                  onPress={() => addDesignerBlock(item.type)}
                  style={styles.blockTool}
                >
                  <Text style={styles.blockToolShort}>{item.short}</Text>
                  <Text style={styles.blockToolText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.canvas}>
              <Text style={styles.canvasLabel}>Canvas</Text>
              {designerBlocks.map((block) => {
                const active = block.id === selectedBlock?.id;
                return (
                  <Pressable
                    key={block.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedBlockId(block.id)}
                    style={[styles.canvasBlock, active && styles.activeCanvasBlock]}
                  >
                    <Text style={styles.canvasBlockType}>{block.label}</Text>
                    <Text
                      numberOfLines={block.type === "text" || block.type === "html" ? 3 : 1}
                      style={[
                        styles.canvasBlockText,
                        { color: block.type === "button" ? block.backgroundColor : block.color, textAlign: block.align },
                      ]}
                    >
                      {block.type === "divider" ? "----------" : block.content || block.url || "Empty block"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedBlock ? (
              <View style={styles.properties}>
                <Text style={styles.propertiesTitle}>Editing {selectedBlock.label}</Text>
                {selectedBlock.type !== "divider" ? (
                  <TextField
                    label={selectedBlock.type === "image" ? "Alt text" : "Content"}
                    multiline={selectedBlock.type === "text" || selectedBlock.type === "html"}
                    onChangeText={(value) => updateSelectedBlock({ content: value })}
                    value={selectedBlock.content}
                  />
                ) : null}
                {selectedBlock.type === "button" || selectedBlock.type === "image" ? (
                  <TextField
                    autoCapitalize="none"
                    label={selectedBlock.type === "button" ? "Link URL" : "Image URL"}
                    onChangeText={(value) => updateSelectedBlock({ url: value })}
                    value={selectedBlock.url || ""}
                  />
                ) : null}
                {selectedBlock.type !== "image" && selectedBlock.type !== "html" ? (
                  <View style={styles.propertyRow}>
                    <TextField
                      keyboardType="numeric"
                      label="Font size"
                      onChangeText={(value) => updateSelectedBlock({ fontSize: value })}
                      style={styles.compactInput}
                      value={selectedBlock.fontSize}
                    />
                    <TextField
                      autoCapitalize="none"
                      label={selectedBlock.type === "button" ? "Bg color" : "Color"}
                      onChangeText={(value) =>
                        updateSelectedBlock(
                          selectedBlock.type === "button" ? { backgroundColor: value } : { color: value },
                        )
                      }
                      style={styles.compactInput}
                      value={selectedBlock.type === "button" ? selectedBlock.backgroundColor : selectedBlock.color}
                    />
                  </View>
                ) : null}
                <View style={styles.alignRow}>
                  {alignmentOptions.map((align) => {
                    const active = selectedBlock.align === align;
                    return (
                      <Pressable
                        key={align}
                        accessibilityRole="button"
                        onPress={() => updateSelectedBlock({ align })}
                        style={[styles.alignButton, active && styles.activeAlignButton]}
                      >
                        <Text style={[styles.alignText, active && styles.activeAlignText]}>{align}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.designerActions}>
                  <AppButton onPress={applyDesignerToEmail} title="Apply to Email" />
                  <AppButton onPress={removeSelectedBlock} title="Remove Block" variant="danger" />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recipients</Text>
            <Text style={styles.sectionHint}>{parsedRecipients.length} ready to send</Text>
          </View>
        </View>

        <View style={styles.segment}>
          {(["single", "list", "tag"] as RecipientMode[]).map((mode) => {
            const active = recipientMode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                onPress={() => setRecipientMode(mode)}
                style={[styles.segmentItem, active && styles.activeSegmentItem]}
              >
                <Text style={[styles.segmentText, active && styles.activeSegmentText]}>
                  {mode === "single" ? "Single" : mode === "list" ? "List" : "Tag"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {recipientMode === "single" ? (
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Recipient email"
            onChangeText={setSingleRecipient}
            placeholder="customer@email.com"
            value={singleRecipient}
          />
        ) : (
          <TextField
            label={recipientMode === "tag" ? "Loaded tag recipients" : "Recipients"}
            multiline
            onChangeText={setRecipients}
            placeholder="one@email.com, two@email.com"
            value={recipients}
          />
        )}

        {recipientMode === "tag" ? (
          <View style={styles.group}>
            <Text style={styles.label}>Audience tag</Text>
            <ChoiceList
              emptyText="No tags"
              getId={(item) => item.id}
              getLabel={(item) => item.tag_name || "Tag"}
              items={tags}
              onSelect={(item) => setSelectedTagId(item.id)}
              selectedId={selectedTagId}
            />
            <AppButton disabled={loading} onPress={loadTagRecipients} title="Load tag recipients" variant="secondary" />
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Email Editor</Text>
            <Text style={styles.sectionHint}>{wordCount} words · supports HTML and merge tags</Text>
          </View>
        </View>

        <TextField label="Subject" onChangeText={setSubject} placeholder="Your subject line" value={subject} />

        <View style={styles.editorToolbar}>
          {editorActions.map((action) => (
            <Pressable key={action.label} accessibilityRole="button" onPress={() => appendContent(action.insert)} style={styles.toolButton}>
              <Text style={styles.toolText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.mergeRow}>
          {mergeTags.map((tag) => (
            <Pressable key={tag} accessibilityRole="button" onPress={() => appendContent(tag)} style={styles.mergeChip}>
              <Text style={styles.mergeText}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          label="Content"
          multiline
          onChangeText={setContent}
          placeholder="Compose your message here."
          style={styles.editorInput}
          value={content}
        />

        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewSubject}>{subject || "No subject yet"}</Text>
          <Text style={styles.previewContent}>{stripHtml(content) || "Your email content preview will appear here."}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Send Preview</Text>
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Preview email"
          onChangeText={setPreviewEmail}
          value={previewEmail}
        />

        <View style={styles.actions}>
          <AppButton
            loading={sending === "preview"}
            onPress={() => send("preview")}
            title="Send Preview"
            variant="success"
          />
          <AppButton
            loading={sending === "send"}
            onPress={() => send("send")}
            title={`Send ${parsedRecipients.length || ""} Email${parsedRecipients.length === 1 ? "" : "s"}`}
          />
          <AppButton onPress={clearComposer} title="Reset" variant="secondary" />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: colors.dark,
    borderRadius: radii.lg,
    padding: 18,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: colors.darkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  badge: {
    backgroundColor: "#eff6ff",
    borderRadius: radii.pill,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  group: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  segment: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentItem: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  activeSegmentItem: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  activeSegmentText: {
    color: colors.surface,
  },
  smallCommand: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  smallCommandText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  designer: {
    gap: 14,
  },
  blockLibrary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  blockTool: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  blockToolShort: {
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  blockToolText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  canvas: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  canvasLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  canvasBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  activeCanvasBlock: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  canvasBlockType: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  canvasBlockText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  properties: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  propertiesTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  propertyRow: {
    flexDirection: "row",
    gap: 10,
  },
  compactInput: {
    minWidth: 0,
  },
  alignRow: {
    flexDirection: "row",
    gap: 8,
  },
  alignButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  activeAlignButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  alignText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  activeAlignText: {
    color: colors.surface,
  },
  designerActions: {
    gap: 10,
  },
  editorToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toolButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  toolText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  mergeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mergeChip: {
    backgroundColor: "#ecfeff",
    borderColor: "#a5f3fc",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mergeText: {
    color: "#0e7490",
    fontSize: 12,
    fontWeight: "800",
  },
  editorInput: {
    minHeight: 190,
  },
  previewBox: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 14,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewSubject: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  previewContent: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});
