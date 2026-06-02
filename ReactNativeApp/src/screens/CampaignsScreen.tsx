import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { campaignsApi } from "../api/campaignsApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { templatesApi } from "../api/templatesApi";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { ChoiceList } from "../components/ChoiceList";
import { Notice } from "../components/Notice";
import { TextField } from "../components/TextField";
import { colors, radii } from "../theme";
import type { AuthSession, Campaign, CampaignRecipient, EmailAccount, EmailTemplate } from "../types";
import { formatNumber, titleCase } from "../utils/format";

type CampaignsScreenProps = {
  session: AuthSession;
};

type CampaignType = "regular" | "ab_test" | "automated";
type ModalMode = "create" | "edit" | "detail" | "recipients" | "";
type RecipientDraft = CampaignRecipient & { draftEmail: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mutableRecipientStatuses = ["pending", "failed", "bounced"];
const startableStatuses = ["draft", "scheduled", "queued", "failed"];
const pausableStatuses = ["scheduled", "sending", "queued"];
const campaignTypes: Array<{ id: CampaignType; label: string }> = [
  { id: "regular", label: "Regular" },
  { id: "ab_test", label: "A/B Test" },
  { id: "automated", label: "Automated" },
];

function parseRecipients(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => EMAIL_PATTERN.test(item)),
    ),
  ];
}

function formatApiDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(String(value).includes("T") ? value : `${String(value).replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function toIsoDatetime(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toInputDatetime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function statusColor(status?: string) {
  if (status === "sent" || status === "completed") return colors.success;
  if (status === "scheduled" || status === "sending" || status === "queued") return colors.warning;
  if (status === "failed") return colors.danger;
  if (status === "paused") return colors.muted;
  return colors.primary;
}

function statusBg(status?: string) {
  if (status === "sent" || status === "completed") return "#dcfce7";
  if (status === "scheduled" || status === "sending" || status === "queued") return "#fef3c7";
  if (status === "failed") return "#fee2e2";
  if (status === "paused") return "#e2e8f0";
  return colors.primarySoft;
}

function ownerText(item: Campaign) {
  if (item.owner_name || item.owner_email) {
    return `${item.owner_name || "Owner"} (${item.owner_email || "no email"})`;
  }
  return "";
}

export function CampaignsScreen({ session }: CampaignsScreenProps) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [emailAccountId, setEmailAccountId] = useState<number | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType>("regular");
  const [scheduledTime, setScheduledTime] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [recipients, setRecipients] = useState<RecipientDraft[]>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [recipientBusyId, setRecipientBusyId] = useState<number | "new" | null>(null);

  const totalRecipients = useMemo(
    () => items.reduce((total, item) => total + Number(item.total_recipients || 0), 0),
    [items],
  );
  const sentCampaigns = useMemo(
    () => items.filter((item) => ["sent", "completed"].includes(String(item.status || ""))).length,
    [items],
  );
  const parsedRecipients = useMemo(() => parseRecipients(recipientsText), [recipientsText]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await campaignsApi.list(session, 100);
      setItems(page.items || []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Campaigns failed");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadOptions() {
    const [templatePage, accountRows] = await Promise.all([
      templatesApi.list(session, { pageSize: 100, isActive: true }),
      emailAccountsApi.list(session),
    ]);
    setTemplates(templatePage.items || []);
    setAccounts(accountRows || []);
    return { templates: templatePage.items || [], accounts: accountRows || [] };
  }

  function showNotice(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2600);
  }

  function resetForm(nextTemplates = templates, nextAccounts = accounts) {
    setCampaignName("");
    setTemplateId(nextTemplates[0]?.id || null);
    setEmailAccountId(nextAccounts[0]?.id || null);
    setCampaignType("regular");
    setScheduledTime("");
    setRecipientsText("");
    setRecipients([]);
    setNewRecipientEmail("");
    setRecipientBusyId(null);
  }

  async function openCreateModal() {
    try {
      const options = await loadOptions();
      if (!options.templates.length || !options.accounts.length) {
        Alert.alert("Missing setup", "Create at least one template and one sender account before creating a campaign.");
        return;
      }
      setSelectedCampaign(null);
      resetForm(options.templates, options.accounts);
      setModalMode("create");
    } catch (nextError) {
      Alert.alert("Options failed", nextError instanceof Error ? nextError.message : "Failed to load campaign options");
    }
  }

  async function openEditModal(item: Campaign) {
    if (!canEditCampaign(item)) {
      Alert.alert("Campaign locked", "Campaign is sending or already sent successfully and cannot be edited.");
      return;
    }

    try {
      await loadOptions();
      setSelectedCampaign(item);
      setCampaignName(item.campaign_name || "");
      setTemplateId(item.template_id || null);
      setEmailAccountId(item.email_account_id || null);
      setCampaignType(item.campaign_type || "regular");
      setScheduledTime(toInputDatetime(item.scheduled_time));
      setRecipientsText("");
      setNewRecipientEmail("");
      setModalMode("edit");
      await loadRecipients(item.id);
    } catch (nextError) {
      Alert.alert("Campaign failed", nextError instanceof Error ? nextError.message : "Failed to load campaign");
    }
  }

  async function openDetailModal(item: Campaign) {
    setSelectedCampaign(item);
    setModalMode("detail");
  }

  async function openRecipientsModal(item: Campaign) {
    setSelectedCampaign(item);
    setModalMode("recipients");
    await loadRecipients(item.id);
  }

  async function loadRecipients(campaignId: number) {
    setRecipientBusyId("new");
    try {
      const page = await campaignsApi.recipients(session, campaignId, 100);
      setRecipients(
        (page.items || []).map((row) => ({
          ...row,
          draftEmail: row.email || "",
        })),
      );
    } catch (nextError) {
      Alert.alert("Recipients failed", nextError instanceof Error ? nextError.message : "Failed to load recipients");
    } finally {
      setRecipientBusyId(null);
    }
  }

  function closeModal() {
    setModalMode("");
    setSelectedCampaign(null);
    setRecipients([]);
    setNewRecipientEmail("");
    setRecipientBusyId(null);
  }

  async function submitCampaign() {
    if (saving) return;
    if (!campaignName.trim() || !templateId || !emailAccountId) {
      Alert.alert("Missing info", "Campaign name, template and sender account are required.");
      return;
    }

    setSaving(true);
    try {
      const nextScheduledTime = toIsoDatetime(scheduledTime);
      const body = {
        campaignName: campaignName.trim(),
        templateId,
        emailAccountId,
        campaignType,
        ...(nextScheduledTime || modalMode === "edit" ? { scheduledTime: nextScheduledTime } : {}),
        ...(modalMode === "create" && parsedRecipients.length ? { recipientEmails: parsedRecipients } : {}),
      };

      if (modalMode === "edit" && selectedCampaign) {
        await campaignsApi.update(session, selectedCampaign.id, body);
        showNotice("Campaign updated.");
      } else {
        await campaignsApi.create(session, body);
        showNotice("Campaign created.");
      }
      closeModal();
      await load();
    } catch (nextError) {
      Alert.alert("Save failed", nextError instanceof Error ? nextError.message : "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function startCampaign(item: Campaign) {
    await runCampaignAction(item, "start");
  }

  async function pauseCampaign(item: Campaign) {
    await runCampaignAction(item, "pause");
  }

  async function resumeCampaign(item: Campaign) {
    await runCampaignAction(item, "resume");
  }

  async function runCampaignAction(item: Campaign, action: "start" | "pause" | "resume") {
    setBusyId(item.id);
    try {
      if (action === "start") await campaignsApi.start(session, item.id);
      if (action === "pause") await campaignsApi.pause(session, item.id);
      if (action === "resume") await campaignsApi.resume(session, item.id);
      showNotice(action === "resume" ? "Campaign continued." : `Campaign ${action}ed.`);
      await load();
    } catch (nextError) {
      Alert.alert("Campaign failed", nextError instanceof Error ? nextError.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCampaign(item: Campaign) {
    Alert.alert("Delete campaign", `Delete ${item.campaign_name || "this campaign"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusyId(item.id);
          try {
            await campaignsApi.delete(session, item.id);
            showNotice("Campaign deleted.");
            await load();
          } catch (nextError) {
            Alert.alert("Delete failed", nextError instanceof Error ? nextError.message : "Failed to delete campaign");
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  async function addRecipient() {
    if (!selectedCampaign) return;
    const email = newRecipientEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      Alert.alert("Invalid email", "Recipient email is invalid.");
      return;
    }
    setRecipientBusyId("new");
    try {
      await campaignsApi.addRecipient(session, selectedCampaign.id, email);
      setNewRecipientEmail("");
      await Promise.all([loadRecipients(selectedCampaign.id), load()]);
    } catch (nextError) {
      Alert.alert("Recipient failed", nextError instanceof Error ? nextError.message : "Failed to add recipient");
    } finally {
      setRecipientBusyId(null);
    }
  }

  async function saveRecipient(row: RecipientDraft) {
    if (!selectedCampaign) return;
    const email = row.draftEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      Alert.alert("Invalid email", "Recipient email is invalid.");
      return;
    }
    setRecipientBusyId(row.id);
    try {
      await campaignsApi.updateRecipient(session, selectedCampaign.id, row.id, email);
      await Promise.all([loadRecipients(selectedCampaign.id), load()]);
    } catch (nextError) {
      Alert.alert("Recipient failed", nextError instanceof Error ? nextError.message : "Failed to update recipient");
    } finally {
      setRecipientBusyId(null);
    }
  }

  async function deleteRecipient(row: RecipientDraft) {
    if (!selectedCampaign) return;
    setRecipientBusyId(row.id);
    try {
      await campaignsApi.deleteRecipient(session, selectedCampaign.id, row.id);
      await Promise.all([loadRecipients(selectedCampaign.id), load()]);
    } catch (nextError) {
      Alert.alert("Recipient failed", nextError instanceof Error ? nextError.message : "Failed to delete recipient");
    } finally {
      setRecipientBusyId(null);
    }
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Campaign Center</Text>
          <Text style={styles.title}>Campaigns</Text>
          <Text style={styles.subtitle}>Create, edit, import recipients and monitor backend campaigns.</Text>
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Notice message={error} tone="error" /> : null}

        <AppButton onPress={() => void openCreateModal()} title="+ New Campaign" />

        <View style={styles.stats}>
          <StatCard accent={colors.primary} label="Total" note="Campaigns loaded" value={items.length} />
          <StatCard accent={colors.success} label="Recipients" note="Total audience" value={totalRecipients} />
          <StatCard accent={colors.violet} label="Sent" note="Completed campaigns" value={sentCampaigns} />
        </View>

        {items.length ? (
          <View style={styles.board}>
            {items.map((campaign) => (
              <CampaignCard
                campaign={campaign}
                key={campaign.id}
                loading={busyId === campaign.id}
                onDelete={() => void deleteCampaign(campaign)}
                onDetail={() => void openDetailModal(campaign)}
                onEdit={() => void openEditModal(campaign)}
                onPause={() => void pauseCampaign(campaign)}
                onRecipients={() => void openRecipientsModal(campaign)}
                onResume={() => void resumeCampaign(campaign)}
                onStart={() => void startCampaign(campaign)}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>CM</Text>
            <Text style={styles.sectionTitle}>No campaigns found.</Text>
            <Text style={styles.subtitle}>Create your first campaign with a template, sender account and recipient list.</Text>
            <AppButton onPress={() => void openCreateModal()} title="Create Campaign" />
          </Card>
        )}
      </ScrollView>

      <Modal visible={Boolean(modalMode)} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.eyebrow}>{modalMode === "edit" ? "Edit campaign" : modalMode === "detail" ? "Campaign detail" : modalMode === "recipients" ? "Recipients" : "New campaign"}</Text>
                <Text style={styles.modalTitle}>
                  {modalMode === "edit" ? "Update campaign details" : modalMode === "detail" ? selectedCampaign?.campaign_name || "Campaign" : modalMode === "recipients" ? "Manage recipients" : "Create campaign"}
                </Text>
                <Text style={styles.subtitle}>
                  {modalMode === "recipients"
                    ? "Add, edit or remove pending recipients."
                    : modalMode === "detail"
                      ? "Review campaign delivery and configuration."
                      : "Configure campaign info and recipients before sending."}
                </Text>
              </View>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeText}>x</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalBody}>
              {modalMode === "detail" && selectedCampaign ? (
                <CampaignDetail campaign={selectedCampaign} />
              ) : null}

              {(modalMode === "create" || modalMode === "edit") ? (
                <>
                  <TextField label="Campaign name *" onChangeText={setCampaignName} placeholder="Spring Launch" value={campaignName} />
                  <Text style={styles.fieldLabel}>Template *</Text>
                  <ChoiceList
                    emptyText="No templates"
                    getId={(item) => item.id}
                    getLabel={(item) => item.template_name || `Template #${item.id}`}
                    items={templates}
                    onSelect={(item) => setTemplateId(item.id)}
                    selectedId={templateId}
                  />
                  <Text style={styles.fieldLabel}>Sender account *</Text>
                  <ChoiceList
                    emptyText="No sender accounts"
                    getId={(item) => item.id}
                    getLabel={(item) => item.display_name || item.email_address || `Account #${item.id}`}
                    items={accounts}
                    onSelect={(item) => setEmailAccountId(item.id)}
                    selectedId={emailAccountId}
                  />
                  <Text style={styles.fieldLabel}>Campaign type</Text>
                  <ChoiceList
                    emptyText="No types"
                    getId={(item) => item.id}
                    getLabel={(item) => item.label}
                    items={campaignTypes}
                    onSelect={(item) => setCampaignType(item.id)}
                    selectedId={campaignType}
                  />
                  <TextField
                    label="Schedule time"
                    onChangeText={setScheduledTime}
                    placeholder="2026-06-03 09:00"
                    value={scheduledTime}
                  />
                  {modalMode === "create" ? (
                    <>
                      <TextField
                        label="Recipients"
                        multiline
                        onChangeText={setRecipientsText}
                        placeholder="customer@example.com&#10;friend@example.com"
                        value={recipientsText}
                      />
                      <Text style={styles.recipientSummary}>{parsedRecipients.length} valid recipients in form</Text>
                    </>
                  ) : (
                    <RecipientManager
                      onAdd={addRecipient}
                      onChangeNewEmail={setNewRecipientEmail}
                      onDelete={deleteRecipient}
                      onRefresh={() => selectedCampaign && loadRecipients(selectedCampaign.id)}
                      onSave={saveRecipient}
                      recipients={recipients}
                      savingId={recipientBusyId}
                      setRecipients={setRecipients}
                      value={newRecipientEmail}
                    />
                  )}
                  <View style={styles.modalActions}>
                    <AppButton onPress={closeModal} title="Cancel" variant="secondary" />
                    <AppButton loading={saving} onPress={() => void submitCampaign()} title={modalMode === "edit" ? "Save changes" : "Create campaign"} />
                  </View>
                </>
              ) : null}

              {modalMode === "recipients" ? (
                <RecipientManager
                  onAdd={addRecipient}
                  onChangeNewEmail={setNewRecipientEmail}
                  onDelete={deleteRecipient}
                  onRefresh={() => selectedCampaign && loadRecipients(selectedCampaign.id)}
                  onSave={saveRecipient}
                  recipients={recipients}
                  savingId={recipientBusyId}
                  setRecipients={setRecipients}
                  value={newRecipientEmail}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function canEditCampaign(item: Campaign) {
  const status = String(item.status || "draft");
  if (status === "sending") return false;
  return !(status === "sent" && Number(item.sent_count || 0) > 0);
}

function canStartCampaign(item: Campaign) {
  return startableStatuses.includes(String(item.status || "draft"));
}

function canPauseCampaign(item: Campaign) {
  return pausableStatuses.includes(String(item.status || ""));
}

function canResumeCampaign(item: Campaign) {
  return String(item.status || "") === "paused";
}

function canDeleteCampaign(item: Campaign) {
  return String(item.status || "") !== "sending";
}

function StatCard({ accent, label, note, value }: { accent: string; label: string; note: string; value: number }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{formatNumber(value)}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </Card>
  );
}

function CampaignCard({
  campaign,
  loading,
  onDelete,
  onDetail,
  onEdit,
  onPause,
  onRecipients,
  onResume,
  onStart,
}: {
  campaign: Campaign;
  loading: boolean;
  onDelete: () => void;
  onDetail: () => void;
  onEdit: () => void;
  onPause: () => void;
  onRecipients: () => void;
  onResume: () => void;
  onStart: () => void;
}) {
  const status = campaign.status || "draft";
  return (
    <Card style={styles.campaignCard}>
      <View style={styles.campaignMain}>
        <View style={[styles.statusRail, { backgroundColor: statusColor(status) }]} />
        <View style={styles.campaignText}>
          <Text style={styles.name}>{campaign.campaign_name || "Campaign"}</Text>
          <Text style={styles.meta}>{campaign.template_name || "No template"} - {campaign.sender_email || "No sender"}</Text>
        </View>
      </View>

      <View style={styles.campaignMeta}>
        <Text style={[styles.badge, { backgroundColor: statusBg(status), color: statusColor(status) }]}>{titleCase(status)}</Text>
        {ownerText(campaign) ? <Text style={styles.metaPill}>{ownerText(campaign)}</Text> : null}
        <Text style={styles.metaPill}>{formatNumber(campaign.total_recipients)} recipients</Text>
        <Text style={styles.metaPill}>{formatApiDate(campaign.updated_at || campaign.created_at)}</Text>
      </View>

      <View style={styles.actions}>
        <AppButton disabled={!canEditCampaign(campaign) || loading} onPress={onEdit} style={styles.smallButton} title="Edit" variant="secondary" />
        <AppButton onPress={onDetail} style={styles.smallButton} title="Detail" variant="secondary" />
        <AppButton onPress={onRecipients} style={styles.smallButton} title="Recipients" variant="secondary" />
        {canStartCampaign(campaign) ? <AppButton loading={loading} onPress={onStart} style={styles.smallButton} title="Start" /> : null}
        {canPauseCampaign(campaign) ? <AppButton loading={loading} onPress={onPause} style={styles.smallButton} title="Pause" variant="secondary" /> : null}
        {canResumeCampaign(campaign) ? <AppButton loading={loading} onPress={onResume} style={styles.smallButton} title="Continue" /> : null}
        {canDeleteCampaign(campaign) ? <AppButton loading={loading} onPress={onDelete} style={styles.smallButton} title="Delete" variant="danger" /> : null}
      </View>
    </Card>
  );
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  return (
    <View style={styles.detailGrid}>
      <DetailItem label="Status" value={titleCase(campaign.status || "draft")} />
      <DetailItem label="Template" value={campaign.template_name || "-"} />
      <DetailItem label="Sender" value={campaign.sender_email || "-"} />
      <DetailItem label="Type" value={campaign.campaign_type || "regular"} />
      <DetailItem label="Scheduled" value={formatApiDate(campaign.scheduled_time)} />
      <DetailItem label="Recipients" value={formatNumber(campaign.total_recipients)} />
      <DetailItem label="Sent" value={formatNumber(campaign.sent_count)} />
      <DetailItem label="Open" value={formatNumber(campaign.open_count)} />
      <DetailItem label="Click" value={formatNumber(campaign.click_count)} />
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function RecipientManager({
  onAdd,
  onChangeNewEmail,
  onDelete,
  onRefresh,
  onSave,
  recipients,
  savingId,
  setRecipients,
  value,
}: {
  onAdd: () => void;
  onChangeNewEmail: (value: string) => void;
  onDelete: (row: RecipientDraft) => void;
  onRefresh: () => void;
  onSave: (row: RecipientDraft) => void;
  recipients: RecipientDraft[];
  savingId: number | "new" | null;
  setRecipients: (value: RecipientDraft[]) => void;
  value: string;
}) {
  return (
    <View style={styles.recipientPanel}>
      <View style={styles.recipientHeader}>
        <View style={styles.recipientHeaderText}>
          <Text style={styles.sectionTitle}>Recipients</Text>
          <Text style={styles.subtitle}>Add, edit or remove pending/failed recipients.</Text>
        </View>
        <AppButton loading={savingId === "new"} onPress={onRefresh} style={styles.refreshButton} title="Refresh" variant="secondary" />
      </View>
      <TextField label="Add recipient" onChangeText={onChangeNewEmail} placeholder="new-recipient@example.com" value={value} />
      <AppButton loading={savingId === "new"} onPress={onAdd} title="Add recipient" />
      <Text style={styles.recipientSummary}>{recipients.length} recipients loaded.</Text>
      {recipients.length ? (
        recipients.map((row) => {
          const canEdit = mutableRecipientStatuses.includes(String(row.status || ""));
          return (
            <View key={row.id} style={styles.recipientRow}>
              <TextField
                editable={canEdit && savingId !== row.id}
                label={row.status || "recipient"}
                onChangeText={(text) =>
                  setRecipients(recipients.map((item) => item.id === row.id ? { ...item, draftEmail: text } : item))
                }
                value={row.draftEmail}
              />
              {row.error_message ? <Text style={styles.recipientError}>{row.error_message}</Text> : null}
              <View style={styles.recipientActions}>
                <AppButton disabled={!canEdit || savingId === row.id} loading={savingId === row.id} onPress={() => onSave(row)} style={styles.smallButton} title="Save" variant="secondary" />
                <AppButton disabled={!canEdit || savingId === row.id} onPress={() => onDelete(row)} style={styles.smallButton} title="Delete" variant="danger" />
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.subtitle}>No recipients in this campaign.</Text>
      )}
    </View>
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
  notice: {
    backgroundColor: colors.primarySoft,
    borderColor: "#c7d2fe",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    padding: 12,
  },
  stats: {
    gap: 12,
  },
  statCard: {
    gap: 8,
    minHeight: 112,
    position: "relative",
  },
  statAccent: {
    borderRadius: radii.pill,
    height: 4,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  statNote: {
    color: colors.muted,
    fontSize: 12,
  },
  board: {
    gap: 14,
  },
  campaignCard: {
    gap: 12,
  },
  campaignMain: {
    flexDirection: "row",
    gap: 12,
  },
  statusRail: {
    borderRadius: radii.pill,
    height: 44,
    width: 10,
  },
  campaignText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  campaignMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: radii.pill,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPill: {
    color: colors.muted,
    fontSize: 12,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: "900",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
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
  modalHeaderText: {
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
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  recipientSummary: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  modalActions: {
    gap: 10,
    marginTop: 4,
  },
  detailGrid: {
    gap: 10,
  },
  detailItem: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  recipientPanel: {
    gap: 12,
  },
  recipientHeader: {
    flexDirection: "row",
    gap: 10,
  },
  recipientHeaderText: {
    flex: 1,
  },
  refreshButton: {
    minHeight: 38,
    paddingHorizontal: 10,
  },
  recipientRow: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  recipientActions: {
    flexDirection: "row",
    gap: 8,
  },
  recipientError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
