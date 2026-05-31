<template>
  <section class="content__header header-row">
    <div>
      <p class="eyebrow">Campaign Center</p>
      <h1 class="page-title">Campaigns</h1>
      <p class="page-subtitle">Create, edit, import recipients and monitor backend campaigns.</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary create-btn" @click="openCreateModal">
      + New Campaign
    </button>
  </section>

  <section class="campaign-stats">
    <article class="stat-card stat-card--blue">
      <span>Total</span>
      <strong>{{ campaigns.length }}</strong>
      <small>Campaigns loaded</small>
    </article>
    <article class="stat-card stat-card--green">
      <span>Recipients</span>
      <strong>{{ totalRecipients }}</strong>
      <small>Total audience</small>
    </article>
    <article class="stat-card stat-card--purple">
      <span>Sent</span>
      <strong>{{ sentCampaigns }}</strong>
      <small>Completed campaigns</small>
    </article>
  </section>

  <section class="content__section">
    <div class="campaign-board" v-if="campaigns.length">
      <article v-for="item in campaigns" :key="item.id" class="campaign-row">
        <div class="campaign-main">
          <span class="status-dot" :class="`status-dot--${item.status || 'draft'}`"></span>
          <div>
            <h2>{{ item.campaign_name }}</h2>
            <p>
              {{ item.template_name || "No template" }} - {{ item.sender_email || "No sender" }}
            </p>
          </div>
        </div>
        <div class="campaign-meta">
          <span class="badge" :class="`badge--${item.status || 'draft'}`">{{ item.status }}</span>
          <span v-if="isAdmin && ownerText(item)">{{ ownerText(item) }}</span>
          <span>{{ item.total_recipients || 0 }} recipients</span>
          <span>{{ formatDate(item.updated_at || item.created_at) }}</span>
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn btn--secondary btn--small"
            :disabled="!canManageCampaign(item)"
            :title="manageBlockedTitle(item)"
            @click="openEditModal(item)"
          >
            Edit
          </button>
          <RouterLink :to="`/campaigns/${item.id}`" class="btn btn--secondary btn--small">
            Detail
          </RouterLink>
          <RouterLink :to="`/campaigns/${item.id}/recipients`" class="btn btn--secondary btn--small">
            Recipients
          </RouterLink>
          <button
            v-if="isAdmin"
            type="button"
            class="btn btn--secondary btn--small"
            @click="pauseCampaignAsAdmin(item)"
          >
            Pause
          </button>
          <button
            v-if="isAdmin"
            type="button"
            class="btn btn--danger btn--small"
            @click="deleteCampaignAsAdmin(item)"
          >
            Delete
          </button>
        </div>
      </article>
    </div>
    <div v-else class="empty-panel">
      <div class="empty-icon">CM</div>
      <h2>No campaigns found.</h2>
      <p>Create your first campaign with a template, sender account and Excel recipient list.</p>
      <button type="button" class="btn btn--primary" @click="openCreateModal">
        Create Campaign
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <form class="campaign-modal" @submit.prevent="submitCampaign">
        <header class="modal-header">
          <div>
            <p class="eyebrow">{{ editingCampaign ? "Edit campaign" : "New campaign" }}</p>
            <h2>{{ editingCampaign ? "Update campaign details" : "Create campaign" }}</h2>
            <p>
              Configure campaign info and optionally upload Excel recipients before sending.
            </p>
          </div>
          <button type="button" class="icon-btn" @click="closeModal">x</button>
        </header>

        <div class="form-grid">
          <label class="field field--wide">
            <span>Campaign name *</span>
            <input v-model.trim="form.campaignName" type="text" placeholder="Spring Launch" required />
          </label>

          <label class="field">
            <span>Template *</span>
            <select v-model="form.templateId" required>
              <option disabled value="">Select template</option>
              <option v-for="template in templates" :key="template.id" :value="String(template.id)">
                {{ template.template_name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Sender account *</span>
            <select v-model="form.emailAccountId" required>
              <option disabled value="">Select sender</option>
              <option v-for="account in accounts" :key="account.id" :value="String(account.id)">
                {{ account.display_name || account.email_address }} - {{ account.email_address }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Campaign type</span>
            <select v-model="form.campaignType">
              <option value="regular">Regular</option>
              <option value="ab_test">A/B Test</option>
              <option value="automated">Automated</option>
            </select>
          </label>

          <label class="field">
            <span>Schedule time</span>
            <input v-model="form.scheduledTime" type="datetime-local" />
          </label>
        </div>

        <section class="recipient-panel">
          <div class="recipient-header">
            <div>
              <h3>Recipients</h3>
              <p>
                Import `.xlsx`, `.xls`, or `.csv` with an <strong>email</strong> column.
                Leave empty to use all active contacts.
              </p>
            </div>
            <label class="upload-btn">
              Import Excel
              <input type="file" accept=".xlsx,.xls,.csv" @change="onRecipientFileChange" />
            </label>
          </div>

          <textarea
            v-model="form.recipientsText"
            rows="7"
            placeholder="customer@example.com&#10;friend@example.com"
            @input="recipientsDirty = true"
          ></textarea>

          <div class="recipient-summary">
            <span>{{ parsedRecipients.length }} valid recipients in form</span>
            <span v-if="importSummary">{{ importSummary }}</span>
          </div>
        </section>

        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn--primary" :disabled="saving">
            {{ saving ? "Saving..." : editingCampaign ? "Save changes" : "Create campaign" }}
          </button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { adminApi } from "../api/adminApi";
import { campaignsApi } from "../api/campaignsApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { templatesApi } from "../api/templatesApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  canManageOwnRecord,
  recordOwnerLabel,
} from "../utils/recordOwnership";

type CampaignRow = Record<string, any>;

type CampaignForm = {
  campaignName: string;
  templateId: string;
  emailAccountId: string;
  campaignType: "regular" | "ab_test" | "automated";
  scheduledTime: string;
  recipientsText: string;
};

const notice = useNotice();
const campaigns = ref<CampaignRow[]>([]);
const templates = ref<Array<Record<string, any>>>([]);
const accounts = ref<Array<Record<string, any>>>([]);
const isModalOpen = ref(false);
const saving = ref(false);
const editingCampaign = ref<CampaignRow | null>(null);
const recipientsDirty = ref(false);
const importSummary = ref("");

const form = reactive<CampaignForm>({
  campaignName: "",
  templateId: "",
  emailAccountId: "",
  campaignType: "regular",
  scheduledTime: "",
  recipientsText: "",
});

const totalRecipients = computed(() =>
  campaigns.value.reduce((total, item) => total + Number(item.total_recipients || 0), 0),
);
const sentCampaigns = computed(
  () => campaigns.value.filter((item) => item.status === "sent").length,
);
const parsedRecipients = computed(() => parseRecipientInput(form.recipientsText));
const isAdmin = computed(() => auth.state.user?.role === "admin");

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function canManageCampaign(item: CampaignRow | null) {
  return canManageOwnRecord(item, auth.state.user);
}

function ownerText(item: CampaignRow) {
  return recordOwnerLabel(item);
}

function manageBlockedTitle(item: CampaignRow) {
  return canManageCampaign(item)
    ? ""
    : "Admin can inspect this campaign here, but should not edit another user's campaign in the normal route.";
}

function parseRecipientInput(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)),
    ),
  ];
}

function toDatetimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoDatetime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function resetForm() {
  form.campaignName = "";
  form.templateId = templates.value[0]?.id ? String(templates.value[0].id) : "";
  form.emailAccountId = accounts.value[0]?.id ? String(accounts.value[0].id) : "";
  form.campaignType = "regular";
  form.scheduledTime = "";
  form.recipientsText = "";
  recipientsDirty.value = false;
  importSummary.value = "";
}

async function loadOptions() {
  if (!auth.state.token) return;
  const [templatesRes, accountsRes] = await Promise.all([
    templatesApi.listTemplates(auth.state.token, { pageSize: 100 }),
    emailAccountsApi.list(auth.state.token),
  ]);
  templates.value = templatesRes.data.items;
  accounts.value = accountsRes.data;
}

async function loadCampaigns() {
  if (!auth.state.token) return;
  try {
    const response = await campaignsApi.list(auth.state.token, { pageSize: 100 });
    campaigns.value = response.data.items;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load campaigns";
    notice.show(message, "error");
  }
}

async function openCreateModal() {
  try {
    await loadOptions();
    if (!templates.value.length || !accounts.value.length) {
      notice.show(
        "Create at least one template and one sender account before creating a campaign.",
        "error",
      );
      return;
    }
    editingCampaign.value = null;
    resetForm();
    isModalOpen.value = true;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load campaign options";
    notice.show(message, "error");
  }
}

async function openEditModal(item: CampaignRow) {
  if (!canManageCampaign(item)) {
    notice.show(
      "Admin should not edit another user's campaign from the normal campaign route.",
      "error",
    );
    return;
  }
  if (["sending", "sent"].includes(String(item.status))) {
    notice.show("Only draft, scheduled or paused campaigns can be edited.", "error");
    return;
  }

  try {
    await loadOptions();
    editingCampaign.value = item;
    form.campaignName = String(item.campaign_name || "");
    form.templateId = item.template_id ? String(item.template_id) : "";
    form.emailAccountId = item.email_account_id ? String(item.email_account_id) : "";
    form.campaignType = item.campaign_type || "regular";
    form.scheduledTime = toDatetimeLocal(item.scheduled_time);
    form.recipientsText = "";
    recipientsDirty.value = false;
    importSummary.value = "Leave recipients empty to keep the existing audience.";
    isModalOpen.value = true;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load campaign options";
    notice.show(message, "error");
  }
}

async function pauseCampaignAsAdmin(item: CampaignRow) {
  if (!auth.state.token) return;
  try {
    await adminApi.pauseCampaign(auth.state.token, item.id);
    notice.show("Campaign paused.", "success");
    await loadCampaigns();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to pause campaign";
    notice.show(message, "error");
  }
}

async function deleteCampaignAsAdmin(item: CampaignRow) {
  if (!auth.state.token) return;
  if (!window.confirm(`Delete campaign ${item.campaign_name || item.id}?`)) return;
  try {
    await adminApi.deleteCampaign(auth.state.token, item.id);
    notice.show("Campaign deleted.", "success");
    await loadCampaigns();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to delete campaign";
    notice.show(message, "error");
  }
}

function closeModal() {
  isModalOpen.value = false;
}

async function onRecipientFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !auth.state.token) return;

  try {
    const response = await campaignsApi.importRecipients(auth.state.token, file);
    const merged = [
      ...new Set([...parsedRecipients.value, ...response.data.recipients]),
    ];
    form.recipientsText = merged.join("\n");
    recipientsDirty.value = true;
    importSummary.value = `Imported ${response.data.importedCount}/${response.data.totalRows} rows`;
    if (response.data.invalidRows) {
      importSummary.value += `, skipped ${response.data.invalidRows} invalid rows`;
    }
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to import recipients";
    notice.show(message, "error");
  }
}

async function submitCampaign() {
  if (!auth.state.token || saving.value) return;
  if (!form.templateId || !form.emailAccountId) {
    notice.show("Template and sender account are required.", "error");
    return;
  }

  saving.value = true;
  try {
    const recipientEmails = parsedRecipients.value;
    const scheduledTime = toIsoDatetime(form.scheduledTime);
    const body = {
      campaignName: form.campaignName,
      templateId: Number(form.templateId),
      emailAccountId: Number(form.emailAccountId),
      campaignType: form.campaignType,
      ...(scheduledTime || editingCampaign.value ? { scheduledTime } : {}),
      ...(recipientEmails.length || recipientsDirty.value ? { recipientEmails } : {}),
    };

    if (editingCampaign.value) {
      await campaignsApi.update(auth.state.token, editingCampaign.value.id, body);
      notice.show("Campaign updated.", "success");
    } else {
      await campaignsApi.create(auth.state.token, body);
      notice.show("Campaign created.", "success");
    }

    closeModal();
    await loadCampaigns();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to save campaign";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadCampaigns();
});
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.create-btn {
  box-shadow: 0 14px 30px var(--shadow-primary-soft-color);
}

.campaign-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 22px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  background: var(--color-bg-surface-elevated);
  box-shadow: var(--shadow-elevated);
}

.stat-card span,
.stat-card small {
  display: block;
  color: var(--color-text-muted);
}

.stat-card strong {
  display: block;
  margin: 12px 0 4px;
  font-size: 34px;
  color: var(--color-text-main);
}

.stat-card--blue { border-top: 3px solid var(--color-info-soft); }
.stat-card--green { border-top: 3px solid var(--color-success); }
.stat-card--purple { border-top: 3px solid var(--color-primary-soft); }

.campaign-board {
  display: grid;
  gap: 14px;
}

.campaign-row {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.9fr) auto;
  gap: 18px;
  align-items: center;
  padding: 20px 22px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, var(--color-primary-glow), var(--color-transparent) 34%),
    var(--color-bg-surface-elevated);
  box-shadow: var(--shadow-elevated);
}

.campaign-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14px;
}

.campaign-main h2 {
  margin: 0 0 5px;
  font-size: 18px;
  color: var(--color-text-main);
}

.campaign-main p,
.campaign-meta {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.campaign-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.status-dot {
  width: 14px;
  height: 44px;
  border-radius: 999px;
  background: var(--color-text-faint);
}

.status-dot--draft { background: linear-gradient(180deg, var(--color-purple-soft), var(--color-primary-soft)); }
.status-dot--scheduled { background: linear-gradient(180deg, var(--color-info-accent), var(--color-info)); }
.status-dot--sending { background: linear-gradient(180deg, var(--color-warning-soft), var(--color-orange)); }
.status-dot--sent { background: linear-gradient(180deg, var(--color-success-soft), var(--color-success-strong)); }
.status-dot--paused { background: linear-gradient(180deg, var(--color-border-muted), var(--color-slate)); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--color-control-bg-muted);
  color: var(--color-text-main);
  font-size: 12px;
  font-weight: 700;
}

.badge--sent {
  background: var(--color-success-bg);
  color: var(--color-success-text-strong);
}

.badge--sending,
.badge--scheduled {
  background: var(--color-chip-yellow-bg);
  color: var(--color-chip-yellow-text);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn--small {
  padding: 8px 12px;
  font-size: 12px;
  text-decoration: none;
}

.empty-panel {
  padding: 44px 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  background: var(--color-bg-surface-elevated);
  text-align: center;
  box-shadow: var(--shadow-elevated);
}

.empty-icon {
  font-size: 42px;
}

.empty-panel h2 {
  margin: 12px 0 6px;
}

.empty-panel p {
  margin: 0 auto 20px;
  max-width: 520px;
  color: var(--color-text-muted);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--color-overlay);
  backdrop-filter: blur(8px);
}

.campaign-modal {
  width: min(920px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 26px;
  border: 1px solid var(--color-modal-border-muted);
  border-radius: 28px;
  background:
    linear-gradient(135deg, var(--color-surface-glass), var(--color-surface-glass-muted)),
    var(--color-bg-surface-elevated);
  box-shadow: 0 28px 80px var(--shadow-modal-color);
}

.modal-header,
.recipient-header,
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.modal-header h2 {
  margin: 0 0 6px;
  color: var(--color-text-main);
}

.modal-header p,
.recipient-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.icon-btn {
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-bg-surface-elevated);
  color: var(--color-text-main);
  font-size: 24px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.field {
  display: grid;
  gap: 8px;
  color: var(--color-text-main);
  font-weight: 700;
}

.field--wide {
  grid-column: 1 / -1;
}

.field input,
.field select,
.recipient-panel textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-white);
  color: var(--color-text-main);
  font: inherit;
}

.field input,
.field select {
  min-height: 48px;
  padding: 0 14px;
}

.recipient-panel {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid var(--color-border-info);
  border-radius: 20px;
  background: linear-gradient(135deg, var(--color-info-bg), var(--color-bg-surface-soft));
}

.recipient-header h3 {
  margin: 0 0 6px;
  color: var(--color-text-main);
}

.upload-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 132px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--color-info-text);
  color: var(--color-white);
  font-weight: 800;
  cursor: pointer;
}

.upload-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.recipient-panel textarea {
  min-height: 150px;
  margin-top: 16px;
  padding: 14px;
  resize: vertical;
}

.recipient-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: var(--color-info-text);
  font-size: 13px;
  font-weight: 700;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 22px;
}

@media (max-width: 980px) {
  .campaign-stats,
  .campaign-row,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: stretch;
  }

  .actions .btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .header-row .btn,
  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .modal-backdrop {
    padding: 12px;
    align-items: end;
  }

  .campaign-modal {
    max-height: 92vh;
    padding: 20px;
    border-radius: 24px 24px 0 0;
  }

  .modal-header,
  .recipient-header,
  .modal-actions,
  .recipient-summary {
    flex-direction: column;
  }

  .upload-btn,
  .modal-actions .btn {
    width: 100%;
  }
}
</style>
