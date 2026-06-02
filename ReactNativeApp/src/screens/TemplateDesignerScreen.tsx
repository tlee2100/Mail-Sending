import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { templatesApi } from "../api/templatesApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { ChoiceList } from "../components/ChoiceList";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, EmailTemplate, TemplateLayoutNode } from "../types";
import {
  blockSummary,
  blocksToLayout,
  createBlock,
  defaultLayout,
  designerPalette,
  layoutToBlocks,
  mergeTags,
  renderTemplateHtml,
  renderTemplateText,
  sampleLayout,
  sampleOptions,
  type DesignerBlockType,
  type SampleKey,
} from "../utils/templateDesigner";

type TemplateDesignerScreenProps = {
  session: AuthSession;
  initialTemplateId?: number | null;
};

function blockLabel(type: string) {
  return designerPalette.find((item) => item.type === type)?.label || type;
}

function getProp(block: TemplateLayoutNode | null, key: string) {
  return String(block?.props?.[key] ?? "");
}

function numberProp(block: TemplateLayoutNode, key: string, fallback: number) {
  const value = Number(block.props?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function plainHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlHeading(value: string) {
  const match = value.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  return match ? plainHtml(match[1]) : "Custom HTML";
}

function ensureBlockIds(blocks: TemplateLayoutNode[]) {
  return blocks.map((block, index) => ({
    ...block,
    id: block.id || `blk_loaded_${block.type || "block"}_${index}_${Date.now()}`,
    children: block.children?.map((child, childIndex) => ({
      ...child,
      id: child.id || `blk_child_${child.type || "block"}_${index}_${childIndex}_${Date.now()}`,
    })),
  }));
}

type EmailPreviewProps = {
  blocks: TemplateLayoutNode[];
  device: "desktop" | "mobile";
  html: string;
  mode: "email" | "html" | "text";
  subject?: string;
  text: string;
};

function EmailPreview({ blocks, device, html, mode, subject, text }: EmailPreviewProps) {
  if (mode === "html") {
    return (
      <ScrollView style={styles.codePane} nestedScrollEnabled>
        <Text style={styles.codeText}>{html}</Text>
      </ScrollView>
    );
  }

  if (mode === "text") {
    return (
      <ScrollView style={styles.codePane} nestedScrollEnabled>
        <Text style={styles.codeText}>{text || "No preview text"}</Text>
      </ScrollView>
    );
  }

  const isMobile = device === "mobile";

  return (
    <ScrollView
      horizontal={!isMobile}
      nestedScrollEnabled
      showsHorizontalScrollIndicator
      showsVerticalScrollIndicator
      style={styles.previewScroll}
      contentContainerStyle={styles.previewScrollInner}
    >
      <View style={[styles.emailCanvas, isMobile ? styles.mobileCanvas : styles.desktopCanvas]}>
        {subject ? <Text style={styles.emailSubject}>{subject}</Text> : null}
        {blocks.map((block) => (
          <PreviewBlock block={block} key={block.id} />
        ))}
      </View>
    </ScrollView>
  );
}

function PreviewBlock({ block }: { block: TemplateLayoutNode }) {
  if (block.type === "text") {
    return (
      <Text
        style={[
          styles.emailText,
          {
            color: getProp(block, "color") || "#334155",
            fontSize: numberProp(block, "fontSize", 16),
            textAlign: (getProp(block, "align") || "left") as "left" | "center" | "right",
          },
        ]}
      >
        {getProp(block, "content")}
      </Text>
    );
  }

  if (block.type === "button") {
    return (
      <View style={styles.emailButtonWrap}>
        <View
          style={[
            styles.emailButton,
            {
              backgroundColor: getProp(block, "backgroundColor") || colors.primary,
              borderRadius: numberProp(block, "borderRadius", 10),
            },
          ]}
        >
          <Text style={[styles.emailButtonText, { color: getProp(block, "textColor") || "#ffffff" }]}>
            {getProp(block, "label") || "Button"}
          </Text>
        </View>
      </View>
    );
  }

  if (block.type === "image") {
    return (
      <Image
        resizeMode="cover"
        source={{ uri: getProp(block, "src") }}
        style={styles.emailImage}
      />
    );
  }

  if (block.type === "imageCard") {
    return (
      <View style={styles.imageCardPreview}>
        <Image resizeMode="cover" source={{ uri: getProp(block, "imageSrc") }} style={styles.imageCardImage} />
        <View style={styles.imageCardBody}>
          <Text style={styles.imageCardTitle}>{getProp(block, "title") || "Feature title"}</Text>
          <Text style={styles.imageCardDescription}>{getProp(block, "description")}</Text>
          <Text style={styles.imageCardLink}>{getProp(block, "ctaLabel") || "Learn more"}</Text>
        </View>
      </View>
    );
  }

  if (block.type === "columns") {
    return (
      <View style={styles.columnsPreview}>
        <Text style={[styles.columnText, { color: getProp(block, "color") || "#334155" }]}>
          {getProp(block, "leftContent")}
        </Text>
        <Text style={[styles.columnText, { color: getProp(block, "color") || "#334155" }]}>
          {getProp(block, "rightContent")}
        </Text>
      </View>
    );
  }

  if (block.type === "qrcode") {
    const size = numberProp(block, "size", 180);
    const uri = `https://quickchart.io/qr?text=${encodeURIComponent(getProp(block, "value"))}&size=${size}`;
    return (
      <View style={styles.qrPreview}>
        <Text style={styles.qrTitle}>{getProp(block, "title") || "QR Code"}</Text>
        <Image source={{ uri }} style={styles.qrImage} />
        <Text style={styles.qrCaption}>{getProp(block, "caption")}</Text>
      </View>
    );
  }

  if (block.type === "html") {
    const html = getProp(block, "html");
    return (
      <View style={styles.htmlPreviewHero}>
        <Text style={styles.htmlPill}>HTML</Text>
        <Text style={styles.htmlHeroTitle}>{htmlHeading(html)}</Text>
        <Text style={styles.htmlHeroText}>{plainHtml(html).replace(htmlHeading(html), "").trim()}</Text>
      </View>
    );
  }

  if (block.type === "divider") {
    return <View style={styles.previewDivider} />;
  }

  return null;
}

export function TemplateDesignerScreen({ session, initialTemplateId }: TemplateDesignerScreenProps) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const inlinePreviewHeight = landscape ? Math.max(190, height - 210) : 430;
  const modalPreviewHeight = landscape ? Math.max(150, height - 178) : Math.min(560, Math.max(360, height - 230));
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sharedTemplates, setSharedTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialTemplateId || null);
  const [selectedSample, setSelectedSample] = useState<SampleKey>("aiShowcase");
  const [blocks, setBlocks] = useState<TemplateLayoutNode[]>(() => ensureBlockIds(layoutToBlocks(defaultLayout())));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | "">("");
  const [info, setInfo] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"email" | "html" | "text">("email");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ||
      sharedTemplates.find((template) => template.id === selectedTemplateId) ||
      null,
    [selectedTemplateId, sharedTemplates, templates],
  );
  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || blocks[0] || null,
    [blocks, selectedBlockId],
  );
  const layout = useMemo(() => blocksToLayout(blocks), [blocks]);
  const renderedHtml = useMemo(() => renderTemplateHtml(layout), [layout]);
  const renderedText = useMemo(() => renderTemplateText(layout), [layout]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const [page, sharedPage] = await Promise.all([
        templatesApi.list(session, { pageSize: 100 }),
        templatesApi.listShared(session, { pageSize: 100, isActive: true }),
      ]);
      const rows = page.items || [];
      const sharedRows = sharedPage.items || [];
      setTemplates(rows);
      setSharedTemplates(sharedRows);
      setSelectedTemplateId((current) => current || initialTemplateId || rows[0]?.id || sharedRows[0]?.id || null);
    } catch (error) {
      Alert.alert("Templates failed", error instanceof Error ? error.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [initialTemplateId, session]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
    }
  }, [initialTemplateId]);

  async function loadDraft(id = selectedTemplateId) {
    if (!id) {
      Alert.alert("No template", "Choose a template first.");
      return;
    }

    setLoading(true);
    try {
      const draft = await templatesApi.getDesigner(session, id);
      const nextBlocks = ensureBlockIds(layoutToBlocks(draft.layout || defaultLayout()));
      setBlocks(nextBlocks);
      setSelectedBlockId(nextBlocks[0]?.id || null);
      setInfo("Designer data loaded.");
    } catch (error) {
      Alert.alert("Designer failed", error instanceof Error ? error.message : "Failed to load designer");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedTemplateId) {
      void loadDraft(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  function addBlock(type: DesignerBlockType) {
    const block = createBlock(type);
    setBlocks((current) => [...current, block]);
    setSelectedBlockId(block.id || null);
  }

  function updateSelectedBlock(key: string, value: string) {
    if (!selectedBlock) {
      return;
    }

    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedBlock.id
          ? { ...block, props: { ...block.props, [key]: value } }
          : block,
      ),
    );
  }

  function duplicateSelectedBlock() {
    if (!selectedBlock) {
      return;
    }
    const copy = {
      ...selectedBlock,
      id: `blk_copy_${Date.now()}`,
      props: { ...selectedBlock.props },
    };
    setBlocks((current) => [...current, copy]);
    setSelectedBlockId(copy.id || null);
  }

  function removeSelectedBlock() {
    if (!selectedBlock) {
      return;
    }
    setBlocks((current) => current.filter((block) => block.id !== selectedBlock.id));
    setSelectedBlockId(null);
  }

  function insertMergeTag(tag: string) {
    if (!selectedBlock) {
      return;
    }
    const key = selectedBlock.type === "button" ? "label" : selectedBlock.type === "html" ? "html" : "content";
    updateSelectedBlock(key, `${getProp(selectedBlock, key)} ${tag}`.trim());
  }

  function applySample() {
    const nextBlocks = ensureBlockIds(layoutToBlocks(sampleLayout(selectedSample)));
    setBlocks(nextBlocks);
    setSelectedBlockId(nextBlocks[0]?.id || null);
    setInfo("Quick sample applied.");
  }

  async function copySelectedSharedTemplate() {
    if (!selectedTemplateId) {
      Alert.alert("No template", "Choose a shared template first.");
      return;
    }

    const shared = sharedTemplates.find((template) => template.id === selectedTemplateId);
    if (!shared) {
      Alert.alert("Not shared", "The selected template is already one of your templates.");
      return;
    }

    setSaving("draft");
    try {
      const detail = await templatesApi.get(session, shared.id);
      const copy = await templatesApi.create(session, {
        templateName: `${detail.template_name || "Shared Template"} (Copy)`,
        subject: detail.subject || undefined,
        previewText: detail.preview_text || undefined,
        contentHtml: detail.content_html || renderedHtml,
        contentText: detail.content_text || renderedText,
        isActive: true,
      });
      await loadTemplates();
      setSelectedTemplateId(copy.id);
      setInfo("Shared template copied. You are now editing your own copy.");
    } catch (error) {
      Alert.alert("Copy failed", error instanceof Error ? error.message : "Failed to copy shared template");
    } finally {
      setSaving("");
    }
  }

  async function save(mode: "draft" | "publish") {
    if (!selectedTemplateId) {
      Alert.alert("No template", "Choose a template first.");
      return;
    }

    setSaving(mode);
    try {
      const body = {
        layout,
        renderedHtml,
        renderedText,
        note: mode === "draft" ? "Saved from Android app" : "Published from Android app",
      };
      if (mode === "draft") {
        await templatesApi.saveDesigner(session, selectedTemplateId, body);
        setInfo("Draft saved.");
      } else {
        await templatesApi.publishDesigner(session, selectedTemplateId, body);
        setInfo("Template published.");
      }
      await loadTemplates();
    } catch (error) {
      Alert.alert("Designer save failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setSaving("");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTemplates} />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Email Editor</Text>
        <Text style={styles.title}>Template Designer</Text>
        <Text style={styles.subtitle}>Build emails visually with reusable blocks, then save a draft or publish.</Text>
      </View>

      {info ? <Text style={styles.notice}>{info}</Text> : null}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Choose a Template</Text>
        <Text style={styles.sectionHint}>Your Templates</Text>
        <ChoiceList
          emptyText="No templates"
          getId={(item) => item.id}
          getLabel={(item) => item.template_name || "Template"}
          items={templates}
          onSelect={(item) => setSelectedTemplateId(item.id)}
          selectedId={selectedTemplateId}
        />
        <Text style={styles.sectionHint}>Shared Templates</Text>
        <ChoiceList
          emptyText="No shared templates"
          getId={(item) => item.id}
          getLabel={(item) => item.template_name || "Shared Template"}
          items={sharedTemplates}
          onSelect={(item) => setSelectedTemplateId(item.id)}
          selectedId={selectedTemplateId}
        />
        <Text style={styles.sectionHint}>
          {selectedTemplate ? `${selectedTemplate.template_name || "Template"} - ${selectedTemplate.is_active === false ? "Inactive" : "Active"}` : "Select a template to load its designer draft."}
        </Text>
        <View style={styles.actions}>
          <AppButton disabled={!selectedTemplateId || loading} onPress={() => void loadDraft()} title="Load Draft" variant="secondary" />
          <AppButton disabled={!sharedTemplates.some((template) => template.id === selectedTemplateId)} loading={saving === "draft"} onPress={() => void copySelectedSharedTemplate()} title="Copy Shared" variant="secondary" />
          <AppButton loading={saving === "draft"} onPress={() => void save("draft")} title="Save Draft" variant="secondary" />
          <AppButton loading={saving === "publish"} onPress={() => void save("publish")} title="Publish" />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Quick Samples</Text>
        <Text style={styles.sectionHint}>Apply a ready-made layout to the canvas, then edit its blocks.</Text>
        <ChoiceList
          emptyText="No samples"
          getId={(item) => item.key}
          getLabel={(item) => item.label}
          items={sampleOptions}
          onSelect={(item) => setSelectedSample(item.key)}
          selectedId={selectedSample}
        />
        <AppButton onPress={applySample} title="Apply Sample" variant="secondary" />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Block Library</Text>
        <View style={styles.palette}>
          {designerPalette.map((item) => (
            <AppButton
              key={item.type}
              onPress={() => addBlock(item.type)}
              style={styles.paletteButton}
              title={`${item.short} ${item.label}`}
              variant="secondary"
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.canvasHead}>
          <View>
            <Text style={styles.sectionTitle}>Canvas</Text>
            <Text style={styles.sectionHint}>{blocks.length} blocks</Text>
          </View>
        </View>
        {blocks.map((block) => {
          const active = block.id === selectedBlock?.id;
          return (
            <AppButton
              key={block.id}
              onPress={() => setSelectedBlockId(block.id || null)}
              style={active ? styles.activeBlockButton : styles.blockButton}
              title={`${blockLabel(block.type)} - ${blockSummary(block).slice(0, 42)}`}
              variant={active ? "primary" : "secondary"}
            />
          );
        })}
      </Card>

      {selectedBlock ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Properties</Text>
          <Text style={styles.sectionHint}>Editing {blockLabel(selectedBlock.type)}</Text>

          {selectedBlock.type === "text" ? (
            <>
              <TextField label="Text content" multiline onChangeText={(value) => updateSelectedBlock("content", value)} value={getProp(selectedBlock, "content")} />
              <View style={styles.row}>
                <TextField label="Font size" keyboardType="numeric" onChangeText={(value) => updateSelectedBlock("fontSize", value)} style={styles.rowInput} value={getProp(selectedBlock, "fontSize")} />
                <TextField label="Color" onChangeText={(value) => updateSelectedBlock("color", value)} style={styles.rowInput} value={getProp(selectedBlock, "color")} />
              </View>
              <TextField label="Align" onChangeText={(value) => updateSelectedBlock("align", value)} value={getProp(selectedBlock, "align")} />
            </>
          ) : null}

          {selectedBlock.type === "button" ? (
            <>
              <TextField label="Button label" onChangeText={(value) => updateSelectedBlock("label", value)} value={getProp(selectedBlock, "label")} />
              <TextField label="Button href" onChangeText={(value) => updateSelectedBlock("href", value)} value={getProp(selectedBlock, "href")} />
              <TextField label="Background color" onChangeText={(value) => updateSelectedBlock("backgroundColor", value)} value={getProp(selectedBlock, "backgroundColor")} />
            </>
          ) : null}

          {selectedBlock.type === "image" ? (
            <>
              <TextField label="Image src" onChangeText={(value) => updateSelectedBlock("src", value)} value={getProp(selectedBlock, "src")} />
              <TextField label="Image alt" onChangeText={(value) => updateSelectedBlock("alt", value)} value={getProp(selectedBlock, "alt")} />
              <TextField label="Image width" keyboardType="numeric" onChangeText={(value) => updateSelectedBlock("width", value)} value={getProp(selectedBlock, "width")} />
            </>
          ) : null}

          {selectedBlock.type === "imageCard" ? (
            <>
              <TextField label="Image src" onChangeText={(value) => updateSelectedBlock("imageSrc", value)} value={getProp(selectedBlock, "imageSrc")} />
              <TextField label="Title" onChangeText={(value) => updateSelectedBlock("title", value)} value={getProp(selectedBlock, "title")} />
              <TextField label="Description" multiline onChangeText={(value) => updateSelectedBlock("description", value)} value={getProp(selectedBlock, "description")} />
              <TextField label="CTA href" onChangeText={(value) => updateSelectedBlock("ctaHref", value)} value={getProp(selectedBlock, "ctaHref")} />
            </>
          ) : null}

          {selectedBlock.type === "columns" ? (
            <>
              <TextField label="Left column text" multiline onChangeText={(value) => updateSelectedBlock("leftContent", value)} value={getProp(selectedBlock, "leftContent")} />
              <TextField label="Right column text" multiline onChangeText={(value) => updateSelectedBlock("rightContent", value)} value={getProp(selectedBlock, "rightContent")} />
            </>
          ) : null}

          {selectedBlock.type === "qrcode" ? (
            <>
              <TextField label="QR content" multiline onChangeText={(value) => updateSelectedBlock("value", value)} value={getProp(selectedBlock, "value")} />
              <TextField label="Title" onChangeText={(value) => updateSelectedBlock("title", value)} value={getProp(selectedBlock, "title")} />
              <TextField label="Caption" onChangeText={(value) => updateSelectedBlock("caption", value)} value={getProp(selectedBlock, "caption")} />
            </>
          ) : null}

          {selectedBlock.type === "html" ? (
            <TextField label="HTML" multiline onChangeText={(value) => updateSelectedBlock("html", value)} value={getProp(selectedBlock, "html")} />
          ) : null}

          {selectedBlock.type === "divider" ? <Text style={styles.sectionHint}>Divider block does not need extra properties.</Text> : null}

          <View style={styles.mergeRow}>
            {mergeTags.map((tag) => (
              <AppButton key={tag} onPress={() => insertMergeTag(tag)} style={styles.mergeButton} title={tag} variant="secondary" />
            ))}
          </View>

          <View style={styles.actions}>
            <AppButton onPress={duplicateSelectedBlock} title="Duplicate" variant="secondary" />
            <AppButton onPress={removeSelectedBlock} title="Remove" variant="danger" />
          </View>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.sectionTitle}>Preview</Text>
            <Text style={styles.sectionHint}>Email preview - {previewDevice}</Text>
          </View>
        </View>
        <View style={styles.segmentRow}>
          <AppButton onPress={() => setPreviewMode("email")} title="Email" variant={previewMode === "email" ? "primary" : "secondary"} style={styles.segmentButton} />
          <AppButton onPress={() => setPreviewMode("html")} title="HTML" variant={previewMode === "html" ? "primary" : "secondary"} style={styles.segmentButton} />
          <AppButton onPress={() => setPreviewMode("text")} title="Text" variant={previewMode === "text" ? "primary" : "secondary"} style={styles.segmentButton} />
        </View>
        <View style={styles.segmentRow}>
          <AppButton onPress={() => setPreviewDevice("desktop")} title="Desktop" variant={previewDevice === "desktop" ? "primary" : "secondary"} style={styles.segmentButton} />
          <AppButton onPress={() => setPreviewDevice("mobile")} title="Mobile" variant={previewDevice === "mobile" ? "primary" : "secondary"} style={styles.segmentButton} />
        </View>
        <Pressable onPress={() => setPreviewOpen(true)} style={[styles.previewFrame, { height: inlinePreviewHeight }]}>
          <View style={styles.tapToEnlarge}>
            <Text style={styles.tapToEnlargeText}>Tap to enlarge</Text>
          </View>
          <EmailPreview blocks={blocks} device={previewDevice} html={renderedHtml} mode={previewMode} subject={selectedTemplate?.subject} text={renderedText} />
        </Pressable>
      </Card>

      <Modal animationType="fade" transparent visible={previewOpen} onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.previewModal, landscape && styles.landscapePreviewModal]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>Preview</Text>
                <Text style={styles.modalTitle}>Email preview - {previewDevice}</Text>
              </View>
              <Pressable onPress={() => setPreviewOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>x</Text>
              </Pressable>
            </View>
            <View style={styles.segmentRow}>
              <AppButton onPress={() => setPreviewMode("email")} title="Email" variant={previewMode === "email" ? "primary" : "secondary"} style={styles.segmentButton} />
              <AppButton onPress={() => setPreviewMode("html")} title="HTML" variant={previewMode === "html" ? "primary" : "secondary"} style={styles.segmentButton} />
              <AppButton onPress={() => setPreviewMode("text")} title="Text" variant={previewMode === "text" ? "primary" : "secondary"} style={styles.segmentButton} />
            </View>
            <View style={styles.segmentRow}>
              <AppButton onPress={() => setPreviewDevice("desktop")} title="Desktop" variant={previewDevice === "desktop" ? "primary" : "secondary"} style={styles.segmentButton} />
              <AppButton onPress={() => setPreviewDevice("mobile")} title="Mobile" variant={previewDevice === "mobile" ? "primary" : "secondary"} style={styles.segmentButton} />
            </View>
            <View style={[styles.modalPreviewFrame, { height: modalPreviewHeight }]}>
              <EmailPreview blocks={blocks} device={previewDevice} html={renderedHtml} mode={previewMode} subject={selectedTemplate?.subject} text={renderedText} />
            </View>
          </View>
        </View>
      </Modal>
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
  notice: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    padding: 12,
  },
  card: {
    borderColor: "#dbe4ff",
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paletteButton: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe4ff",
    minHeight: 40,
    paddingHorizontal: 10,
  },
  canvasHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  blockButton: {
    alignItems: "flex-start",
  },
  activeBlockButton: {
    alignItems: "flex-start",
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    minWidth: 0,
  },
  mergeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mergeButton: {
    minHeight: 38,
    paddingHorizontal: 10,
  },
  previewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8,
  },
  previewFrame: {
    backgroundColor: "#f8fbff",
    borderColor: "#a5b4fc",
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 430,
    overflow: "hidden",
    padding: 10,
    position: "relative",
  },
  tapToEnlarge: {
    backgroundColor: "rgba(91,79,242,0.92)",
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    right: 18,
    top: 18,
    zIndex: 5,
  },
  tapToEnlargeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "900",
  },
  previewScroll: {
    flex: 1,
  },
  previewScrollInner: {
    alignItems: "center",
    minHeight: "100%",
    padding: 8,
  },
  emailCanvas: {
    backgroundColor: colors.surface,
    borderColor: "#dbe4ff",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  desktopCanvas: {
    width: 620,
  },
  mobileCanvas: {
    width: 300,
  },
  emailSubject: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emailText: {
    lineHeight: 24,
  },
  emailButtonWrap: {
    alignItems: "center",
  },
  emailButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  emailImage: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    height: 190,
    width: "100%",
  },
  imageCardPreview: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageCardImage: {
    backgroundColor: colors.surfaceSoft,
    height: 190,
    width: "100%",
  },
  imageCardBody: {
    gap: 8,
    padding: 16,
  },
  imageCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  imageCardDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  imageCardLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  columnsPreview: {
    flexDirection: "row",
    gap: 12,
  },
  columnText: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    padding: 12,
  },
  qrPreview: {
    alignItems: "center",
    backgroundColor: "#f8fbff",
    borderColor: "#bfdbfe",
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  qrTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  qrImage: {
    height: 180,
    width: 180,
  },
  qrCaption: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
  htmlPreviewHero: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    gap: 12,
    overflow: "hidden",
    padding: 28,
  },
  htmlPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.pill,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  htmlHeroTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  htmlHeroText: {
    color: "#eef2ff",
    fontSize: 16,
    lineHeight: 25,
  },
  previewDivider: {
    backgroundColor: colors.border,
    height: 1,
    width: "100%",
  },
  codePane: {
    backgroundColor: "#111827",
    borderRadius: 12,
    flex: 1,
    padding: 12,
  },
  codeText: {
    color: "#dbeafe",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  modalBackdrop: {
    backgroundColor: "rgba(15,23,42,0.72)",
    flex: 1,
    justifyContent: "center",
    padding: 10,
  },
  previewModal: {
    backgroundColor: colors.surface,
    borderColor: "#c7d2fe",
    borderWidth: 1,
    borderRadius: 18,
    gap: 12,
    maxHeight: "92%",
    padding: 14,
  },
  landscapePreviewModal: {
    alignSelf: "center",
    gap: 8,
    maxHeight: "96%",
    padding: 10,
    width: "96%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  closeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  modalPreviewFrame: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
  },
});
