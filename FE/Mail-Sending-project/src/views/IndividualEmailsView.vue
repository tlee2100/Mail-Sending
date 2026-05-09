<template>
  <section class="content__header">
    <h1 class="page-title">Send Individual Emails</h1>
    <p class="page-subtitle">
      Send personalized emails to specific recipients by entering their email addresses.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <div class="alert" :class="hasAccounts ? 'alert--success' : 'alert--danger'">
    <span class="alert__body">
      <strong>{{ hasAccounts ? "SMTP Ready" : "SMTP Not Configured" }}</strong>
      <span>
        {{
          hasAccounts
            ? `Found ${accountCount} configured sender account${accountCount > 1 ? "s" : ""}. You can proceed to compose.`
            : "Add an email account first so preview and send actions have a sender."
        }}
      </span>
    </span>
    <RouterLink to="/email-accounts" class="btn" :class="hasAccounts ? 'btn--secondary' : 'btn--danger'">
      Email Accounts
    </RouterLink>
  </div>

  <div class="grid grid--individual">
    <div class="card card--form">
      <h2 class="card__heading">Email Configuration</h2>
      <div class="import-panel">
        <div>
          <p class="import-panel__title">Import recipients from Excel</p>
          <p class="import-panel__copy">
            Upload `.xlsx`, `.xls`, or `.csv` with an `email` column to append recipients.
          </p>
        </div>
        <div class="import-panel__controls">
          <input
            ref="fileInputRef"
            class="import-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="onFileChange"
          />
          <button
            type="button"
            class="btn btn--secondary"
            :disabled="!selectedFile || isImporting"
            @click="importRecipients"
          >
            {{ isImporting ? "Importing..." : "Import Excel" }}
          </button>
        </div>
        <p v-if="selectedFile" class="import-panel__selected">
          Selected file: {{ selectedFile.name }}
        </p>
        <p v-if="importSummary" class="import-panel__summary">
          {{ importSummary }}
        </p>
      </div>

      <div class="import-panel import-panel--tag">
        <div>
          <p class="import-panel__title">Use a contact tag</p>
          <p class="import-panel__copy">
            Append active contacts from a tag segment into this recipient list.
          </p>
        </div>
        <div class="import-panel__controls">
          <select v-model="selectedTagId" class="tag-select">
            <option value="">Select tag</option>
            <option v-for="tag in tags" :key="tag.id" :value="String(tag.id)">
              {{ tag.tag_name }} ({{ tag.contact_count || 0 }})
            </option>
          </select>
          <button
            type="button"
            class="btn btn--secondary"
            :disabled="!selectedTagId || isLoadingTagRecipients"
            @click="appendTagRecipients"
          >
            {{ isLoadingTagRecipients ? "Loading..." : "Add From Tag" }}
          </button>
        </div>
      </div>

      <div class="input-wrap">
        <label>Recipients *</label>
        <textarea
          v-model="recipients"
          placeholder="Enter email addresses (comma or newline separated)"
          rows="8"
        ></textarea>
        <p class="input-hint">
          e.g. john@example.com, jane@example.com, mike@example.com
        </p>
      </div>
      <RouterLink to="/individual-emails/compose" class="btn btn--primary">
        Continue to Compose
      </RouterLink>
    </div>

    <div class="card card--guidelines">
      <h2 class="card__heading">Email Guidelines</h2>
      <ul class="guidelines-list">
        <li>Enter one or multiple email addresses</li>
        <li>Separate emails with commas or new lines</li>
        <li>Use Email Editor for professional designs</li>
        <li>Send preview before sending to all</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { ApiClientError } from "../api/http";
import { contactsApi } from "../api/contactsApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { individualEmailsApi } from "../api/individualEmailsApi";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  parseRecipientInput,
  readIndividualEmailDraft,
  writeIndividualEmailDraft,
} from "../utils/individualEmailDraft";

const notice = useNotice();
const draft = readIndividualEmailDraft();
const recipients = ref(draft.recipients);
const accountCount = ref(0);
type TagRow = {
  id: number;
  tag_name: string;
  color?: string;
  contact_count?: number;
};

const tags = ref<TagRow[]>([]);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isImporting = ref(false);
const importSummary = ref("");
const selectedTagId = ref("");
const isLoadingTagRecipients = ref(false);
const hasAccounts = computed(() => accountCount.value > 0);

watch(recipients, () => {
  writeIndividualEmailDraft({ recipients: recipients.value });
});

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  selectedFile.value = target?.files?.[0] || null;
}

async function importRecipients() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }
  if (!selectedFile.value) {
    notice.show("Choose an Excel or CSV file first.", "error");
    return;
  }

  isImporting.value = true;
  importSummary.value = "";

  try {
    const result = await individualEmailsApi.importRecipients(
      auth.state.token,
      selectedFile.value,
    );
    const mergedRecipients = parseRecipientInput(
      [recipients.value, ...result.recipients].filter(Boolean).join("\n"),
    );
    recipients.value = mergedRecipients.join("\n");
    importSummary.value = `Imported ${result.importedCount} recipient${result.importedCount === 1 ? "" : "s"} from ${result.totalRows} row${result.totalRows === 1 ? "" : "s"}. Invalid rows: ${result.invalidRows}.`;
    selectedFile.value = null;
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
    notice.show("Recipient file imported.", "success");
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to import recipients";
    notice.show(message, "error");
  } finally {
    isImporting.value = false;
  }
}

async function appendTagRecipients() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }
  if (!selectedTagId.value) {
    notice.show("Choose a tag first.", "error");
    return;
  }

  isLoadingTagRecipients.value = true;
  try {
    const response = await contactsApi.listTagRecipients(
      auth.state.token,
      selectedTagId.value,
    );
    const importedEmails = response.data.recipients
      .map((item) => String(item.email || "").trim())
      .filter(Boolean);
    const mergedRecipients = parseRecipientInput(
      [recipients.value, ...importedEmails].filter(Boolean).join("\n"),
    );
    recipients.value = mergedRecipients.join("\n");
    notice.show(
      `Added ${importedEmails.length} active contact${importedEmails.length === 1 ? "" : "s"} from tag.`,
      "success",
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load tag recipients";
    notice.show(message, "error");
  } finally {
    isLoadingTagRecipients.value = false;
  }
}

async function loadAccounts() {
  if (!auth.state.token) return;

  try {
    const response = await emailAccountsApi.list(auth.state.token);
    accountCount.value = (response.data || []).length;
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load email accounts";
    notice.show(message, "error");
  }
}

async function loadTags() {
  if (!auth.state.token) return;

  try {
    const response = await contactsApi.listTags(auth.state.token);
    tags.value = (response.data || []) as TagRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load tags";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void Promise.all([loadAccounts(), loadTags()]);
});
</script>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.alert--danger {
  background: #dc2626;
  color: white;
}

.alert--success {
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
}

.alert__body {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert__body span {
  font-size: 13px;
}

.grid--individual {
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.card__heading {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.import-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  margin-bottom: 18px;
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(238, 242, 255, 0.9), rgba(248, 250, 252, 0.9));
}

.import-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #312e81;
}

.import-panel__copy,
.import-panel__selected,
.import-panel__summary {
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.import-panel__controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.import-file {
  flex: 1 1 260px;
}

.import-panel--tag {
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.92), rgba(248, 250, 252, 0.92));
  border-color: rgba(34, 197, 94, 0.16);
}

.tag-select {
  flex: 1 1 260px;
  min-width: 180px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
}

.input-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

.guidelines-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: #374151;
}

@media (max-width: 900px) {
  .grid--individual {
    grid-template-columns: 1fr;
  }

  .alert {
    align-items: stretch;
  }

  .alert .btn {
    width: 100%;
    justify-content: center;
  }

  .import-panel__controls .btn {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .grid--individual {
    gap: 14px;
  }

  .card--guidelines {
    order: -1;
  }

  .guidelines-list {
    gap: 8px;
    font-size: 13px;
  }

  .card--form > .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
