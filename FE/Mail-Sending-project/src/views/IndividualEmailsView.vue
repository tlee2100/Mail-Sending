<template>
  <section class="content__header">
    <h1 class="page-title">Send Individual Emails</h1>
    <p class="page-subtitle">
      Send personalized emails to specific recipients by entering their email
      addresses.
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
    <RouterLink
      to="/email-accounts"
      class="btn"
      :class="hasAccounts ? 'btn--secondary' : 'btn--danger'"
    >
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
            Upload `.xlsx`, `.xls`, or `.csv` with an `email` column to append
            recipients.
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

      <div class="import-panel import-panel--contacts">
        <div class="contact-panel__head">
          <div>
            <p class="import-panel__title">Use saved contacts</p>
            <p class="import-panel__copy">
              Pick contacts from your address book, or create a new contact
              here.
            </p>
          </div>
          <button
            type="button"
            class="btn btn--primary"
            @click="openCreateContactModal"
          >
            + Create Contact
          </button>
        </div>

        <div class="contact-panel__controls">
          <input
            v-model="contactSearch"
            type="search"
            class="contact-search"
            placeholder="Search name, email, company, or city"
          />
          <button
            type="button"
            class="btn btn--secondary"
            @click="loadContacts"
          >
            Refresh Contacts
          </button>
          <button
            type="button"
            class="btn btn--secondary"
            :disabled="!selectedContactIds.length"
            @click="appendSelectedContacts"
          >
            Add Selected Contacts
          </button>
        </div>

        <div v-if="filteredContacts.length" class="contact-list">
          <label
            v-for="contact in filteredContacts"
            :key="contact.id"
            class="contact-row"
          >
            <input
              v-model="selectedContactIds"
              type="checkbox"
              :value="String(contact.id)"
            />
            <span class="contact-row__main">
              <strong>{{ fullName(contact) }}</strong>
              <small>{{ contact.email }}</small>
            </span>
            <span class="contact-row__meta">
              {{
                contact.company ||
                contact.city ||
                contact.email_status ||
                "contact"
              }}
            </span>
          </label>
        </div>
        <p v-else-if="contactSearch" class="contact-empty">
          No contacts match this search.
        </p>
        <p v-else class="contact-empty">
          No contacts returned by the API. Create one here or refresh after
          creating contacts.
        </p>
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

  <section class="history-section">
    <div class="section-heading">
      <div>
        <h2>Sent Email History</h2>
        <p>Review delivered individual emails and live recipient tracking.</p>
      </div>
      <button
        type="button"
        class="btn btn--secondary"
        @click="loadSentEmails()"
      >
        Refresh
      </button>
    </div>
    <div class="card card--table">
      <table v-if="sentEmails.length" class="table">
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Sent</th>
            <th>Opens</th>
            <th>Clicks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sentEmails" :key="item.id">
            <td>{{ item.email }}</td>
            <td>{{ item.subject || "(No subject)" }}</td>
            <td>{{ item.status }}</td>
            <td>{{ formatDate(item.sent_time || item.created_at) }}</td>
            <td>{{ item.open_count || 0 }}</td>
            <td>{{ item.click_count || 0 }}</td>
            <td>
              <button
                type="button"
                class="link-action"
                @click="selectEmail(item.id)"
              >
                View email
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-text">No individual emails have been sent yet.</p>
    </div>
  </section>

  <section v-if="selectedEmail" class="message-detail">
    <article class="card message-card">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Sent Email</p>
          <h2>{{ selectedEmail.subject || "(No subject)" }}</h2>
          <p class="meta">
            To: {{ selectedEmail.email }} - Sent:
            {{ formatDate(selectedEmail.sent_time) }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn--secondary"
          @click="selectedEmail = null"
        >
          Close
        </button>
      </div>
      <p class="meta">
        Preview is read-only. The tracking pixel and clickable links are
        disabled here.
      </p>
      <iframe
        class="email-preview"
        :srcdoc="previewHtml"
        sandbox=""
        tabindex="-1"
        title="Individual email preview"
      ></iframe>
    </article>

    <article class="card tracking-card">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Live Tracking</p>
          <h2>Recipient Activity</h2>
        </div>
        <button
          type="button"
          class="btn btn--secondary"
          @click="refreshEmailDetail"
        >
          Refresh
        </button>
      </div>
      <div class="tracking-metrics">
        <div>
          <strong>{{ selectedEmail.open_count || 0 }}</strong
          ><span>Opens</span>
        </div>
        <div>
          <strong>{{ selectedEmail.click_count || 0 }}</strong
          ><span>Clicks</span>
        </div>
        <div>
          <strong>{{ selectedEmail.status }}</strong
          ><span>Status</span>
        </div>
      </div>
      <div v-if="trackingEvents.length" class="timeline">
        <div
          v-for="event in trackingEvents"
          :key="event.id"
          class="timeline-row"
        >
          <div>
            <strong>{{ formatEvent(event.event_type) }}</strong>
            <a
              v-if="event.clicked_url"
              :href="event.clicked_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ event.clicked_url }}
            </a>
          </div>
          <span>{{ formatDate(event.event_time) }}</span>
        </div>
      </div>
      <p v-else class="empty-text">
        No tracking activity recorded for this email yet.
      </p>
    </article>
  </section>

  <div
    v-if="contactDialogOpen"
    class="modal-backdrop"
    @click.self="closeContactDialog"
  >
    <form class="modal-card modal-card--wide" @submit.prevent="saveContact">
      <header class="modal-head">
        <div>
          <p class="modal-kicker">New contact</p>
          <h2 class="modal-title">Create contact</h2>
          <p class="modal-subtitle">
            Recipient profile data is used for email merge tags.
          </p>
        </div>
        <button type="button" class="modal-close" @click="closeContactDialog">
          x
        </button>
      </header>

      <div class="contact-form-grid">
        <label class="field field--wide">
          <span>Email *</span>
          <input
            v-model.trim="contactForm.email"
            type="email"
            required
            placeholder="customer@example.com"
          />
        </label>
        <label class="field">
          <span>First name</span>
          <input
            v-model.trim="contactForm.firstName"
            type="text"
            placeholder="Tan"
          />
        </label>
        <label class="field">
          <span>Last name</span>
          <input
            v-model.trim="contactForm.lastName"
            type="text"
            placeholder="Le"
          />
        </label>
        <label class="field">
          <span>Phone</span>
          <input
            v-model.trim="contactForm.phone"
            type="text"
            placeholder="090..."
          />
        </label>
        <label class="field">
          <span>Company</span>
          <input
            v-model.trim="contactForm.company"
            type="text"
            placeholder="ChadMailer"
          />
        </label>
        <label class="field">
          <span>City</span>
          <input
            v-model.trim="contactForm.city"
            type="text"
            placeholder="Ho Chi Minh"
          />
        </label>
        <label class="field">
          <span>Country</span>
          <input
            v-model.trim="contactForm.country"
            type="text"
            placeholder="Vietnam"
          />
        </label>
        <label class="field">
          <span>Status</span>
          <select v-model="contactForm.emailStatus">
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label class="field">
          <span>Source</span>
          <input
            v-model.trim="contactForm.source"
            type="text"
            placeholder="manual"
          />
        </label>
      </div>

      <footer class="modal-actions">
        <button
          type="button"
          class="btn btn--secondary"
          @click="closeContactDialog"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn--primary"
          :disabled="isSavingContact"
        >
          {{ isSavingContact ? "Saving..." : "Create contact" }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
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

type ContactRow = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  country?: string | null;
  email_status?: string | null;
  source?: string | null;
};

const tags = ref<TagRow[]>([]);
const contacts = ref<ContactRow[]>([]);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isImporting = ref(false);
const importSummary = ref("");
const selectedTagId = ref("");
const isLoadingTagRecipients = ref(false);
const contactSearch = ref("");
const selectedContactIds = ref<string[]>([]);
const contactDialogOpen = ref(false);
const isSavingContact = ref(false);
const contactForm = reactive({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  city: "",
  country: "",
  emailStatus: "active",
  source: "manual",
});
const sentEmails = ref<Array<Record<string, any>>>([]);
const selectedEmail = ref<Record<string, any> | null>(null);
let historyTimer: number | undefined;
const hasAccounts = computed(() => accountCount.value > 0);
const filteredContacts = computed(() => {
  const query = contactSearch.value.trim().toLowerCase();
  return contacts.value.filter((contact) => {
    if (!query) return true;
    return [
      fullName(contact),
      contact.email,
      contact.company,
      contact.city,
      contact.country,
      contact.source,
    ]
      .map((item) => String(item || "").toLowerCase())
      .some((value) => value.includes(query));
  });
});
const trackingEvents = computed(
  () =>
    (selectedEmail.value?.trackingEvents || []) as Array<Record<string, any>>,
);
const previewHtml = computed(() => {
  const html = String(selectedEmail.value?.content_html || "");
  if (!html) {
    return "<p style='font:14px Arial,sans-serif;color:#667085;padding:24px'>No rendered HTML was stored for this email.</p>";
  }
  return html.replace(/<img\b(?=[^>]*\/api\/v1\/tracking\/open\/)[^>]*>/gi, "");
});

watch(recipients, () => {
  writeIndividualEmailDraft({ recipients: recipients.value });
});

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  selectedFile.value = target?.files?.[0] || null;
}

function fullName(contact: ContactRow) {
  const name = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ");
  return name || contact.email;
}

function mergeRecipients(emails: string[]) {
  const mergedRecipients = parseRecipientInput(
    [recipients.value, ...emails].filter(Boolean).join("\n"),
  );
  recipients.value = mergedRecipients.join("\n");
}

function resetContactForm() {
  contactForm.email = "";
  contactForm.firstName = "";
  contactForm.lastName = "";
  contactForm.phone = "";
  contactForm.company = "";
  contactForm.city = "";
  contactForm.country = "";
  contactForm.emailStatus = "active";
  contactForm.source = "manual";
}

function openCreateContactModal() {
  resetContactForm();
  contactDialogOpen.value = true;
}

function closeContactDialog() {
  contactDialogOpen.value = false;
}

function contactPayload() {
  return {
    email: contactForm.email,
    firstName: contactForm.firstName || undefined,
    lastName: contactForm.lastName || undefined,
    phone: contactForm.phone || undefined,
    company: contactForm.company || undefined,
    city: contactForm.city || undefined,
    country: contactForm.country || undefined,
    emailStatus: contactForm.emailStatus || "active",
    source: contactForm.source || "manual",
  };
}

function normalizeContactRow(raw: Record<string, unknown>): ContactRow {
  return {
    id: Number(raw.id || raw.contact_id || Date.now()),
    email: String(raw.email || contactForm.email),
    first_name: String(
      raw.first_name || raw.firstName || contactForm.firstName || "",
    ),
    last_name: String(
      raw.last_name || raw.lastName || contactForm.lastName || "",
    ),
    phone: String(raw.phone || contactForm.phone || ""),
    company: String(raw.company || contactForm.company || ""),
    city: String(raw.city || contactForm.city || ""),
    country: String(raw.country || contactForm.country || ""),
    email_status: String(
      raw.email_status ||
        raw.emailStatus ||
        contactForm.emailStatus ||
        "active",
    ),
    source: String(raw.source || contactForm.source || "manual"),
  };
}

async function saveContact() {
  if (!auth.state.token || isSavingContact.value) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  isSavingContact.value = true;
  try {
    const created = await contactsApi.createContact(
      auth.state.token,
      contactPayload(),
    );
    const createdContact = normalizeContactRow(created.data || {});
    contacts.value = [
      createdContact,
      ...contacts.value.filter(
        (contact) => contact.email !== createdContact.email,
      ),
    ];
    mergeRecipients([contactForm.email]);
    await Promise.all([loadContacts(), loadTags()]);
    closeContactDialog();
    notice.show("Contact created and added to recipients.", "success");
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to create contact";
    notice.show(message, "error");
  } finally {
    isSavingContact.value = false;
  }
}

function appendSelectedContacts() {
  const selected = new Set(selectedContactIds.value);
  const emails = contacts.value
    .filter((contact) => selected.has(String(contact.id)))
    .map((contact) => contact.email)
    .filter(Boolean);

  if (!emails.length) {
    notice.show("Select at least one contact first.", "error");
    return;
  }

  mergeRecipients(emails);
  selectedContactIds.value = [];
  notice.show(
    `Added ${emails.length} contact recipient${emails.length === 1 ? "" : "s"}.`,
    "success",
  );
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
    mergeRecipients(result.recipients);
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
    mergeRecipients(importedEmails);
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

async function loadContacts() {
  if (!auth.state.token) return;

  try {
    const response = await contactsApi.listContacts(auth.state.token, {
      pageSize: 10,
      status: "active",
    });
    contacts.value = (response.data.items || []) as ContactRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load contacts";
    notice.show(message, "error");
  }
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatEvent(eventType?: string) {
  const value = String(eventType || "");
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Event";
}

async function loadSentEmails(silent = false) {
  if (!auth.state.token) return;
  try {
    const response = await individualEmailsApi.list(auth.state.token, {
      pageSize: 50,
    });
    sentEmails.value = response.data.items;
  } catch (error) {
    if (silent) return;
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load sent emails";
    notice.show(message, "error");
  }
}

async function loadEmailDetail(emailId: string | number, silent = false) {
  if (!auth.state.token) return;
  try {
    const response = await individualEmailsApi.get(auth.state.token, emailId);
    selectedEmail.value = response.data;
  } catch (error) {
    if (silent) return;
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load sent email";
    notice.show(message, "error");
  }
}

function selectEmail(emailId: string | number) {
  void loadEmailDetail(emailId);
}

function refreshEmailDetail() {
  if (selectedEmail.value) {
    void loadEmailDetail(selectedEmail.value.id);
  }
}

onMounted(() => {
  void Promise.all([
    loadAccounts(),
    loadTags(),
    loadContacts(),
    loadSentEmails(),
  ]);
  historyTimer = window.setInterval(() => {
    void loadSentEmails(true);
    if (selectedEmail.value) {
      void loadEmailDetail(selectedEmail.value.id, true);
    }
  }, 5000);
});

onUnmounted(() => {
  if (historyTimer !== undefined) {
    window.clearInterval(historyTimer);
  }
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
  background: var(--color-danger);
  color: var(--color-white);
}

.alert--success {
  background: var(--color-success-bg-active);
  color: var(--color-success-text-strong);
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
  border: 1px solid var(--color-primary-border-subtle);
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    var(--color-indigo-glass),
    var(--color-surface-glass-faint)
  );
}

.import-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary-text-strong);
}

.import-panel__copy,
.import-panel__selected,
.import-panel__summary {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-subtle);
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
  background: linear-gradient(
    180deg,
    var(--color-success-glass),
    var(--color-surface-glass-light)
  );
  border-color: var(--color-success-border-soft);
}

.import-panel--contacts {
  background: linear-gradient(
    180deg,
    var(--color-info-bg),
    var(--color-surface-glass-light)
  );
  border-color: var(--color-info-border-soft);
}

.contact-panel__head,
.contact-panel__controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.contact-search {
  flex: 1 1 280px;
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
  font: inherit;
}

.contact-list {
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow: auto;
  padding-right: 4px;
}

.contact-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-control-bg);
}

.contact-row__main {
  display: grid;
  min-width: 0;
}

.contact-row__main strong,
.contact-row__main small,
.contact-row__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-row__main strong {
  color: var(--color-text-main);
  font-size: 13px;
}

.contact-row__main small,
.contact-row__meta,
.contact-empty {
  color: var(--color-text-muted);
  font-size: 12px;
}

.contact-row__meta {
  max-width: 180px;
  font-weight: 700;
}

.contact-empty {
  padding: 14px;
  border: 1px dashed var(--color-border-subtle);
  border-radius: 10px;
  text-align: center;
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
  color: var(--color-text-muted);
  margin-top: 6px;
}

.guidelines-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-subtle);
}

.history-section {
  margin-top: 30px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}
.section-heading h2 {
  margin: 0 0 5px;
  color: var(--color-text-main);
}
.section-heading p,
.meta {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}
.card--table {
  border: 1px solid var(--color-border-subtle);
  overflow-x: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  text-align: left;
  padding: 11px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 13px;
  color: var(--color-text-main);
}
.table th {
  color: var(--color-text-muted);
  font-weight: 600;
}
.empty-text {
  padding: 18px;
  color: var(--color-text-muted);
}
.link-action {
  border: 0;
  background: transparent;
  color: var(--color-accent-primary);
  cursor: pointer;
  font-weight: 700;
}
.message-detail {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
  gap: 18px;
  margin-top: 20px;
}
.message-card,
.tracking-card {
  border: 1px solid var(--color-border-subtle);
}
.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.panel-title h2 {
  margin: 4px 0 6px;
  color: var(--color-text-main);
}
.eyebrow {
  margin: 0;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.email-preview {
  width: 100%;
  min-height: 520px;
  margin-top: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: white;
  pointer-events: none;
}
.tracking-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}
.tracking-metrics div {
  padding: 12px 8px;
  border-radius: 12px;
  background: var(--color-bg-surface-soft);
  text-align: center;
}
.tracking-metrics strong {
  display: block;
  color: var(--color-text-main);
  font-size: 20px;
}
.tracking-metrics span {
  color: var(--color-text-muted);
  font-size: 12px;
}
.timeline {
  display: grid;
  gap: 12px;
}
.timeline-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 12px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.timeline-row strong {
  display: block;
  color: var(--color-text-main);
}
.timeline-row a {
  display: block;
  overflow-wrap: anywhere;
  color: var(--color-accent-primary);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-overlay-muted);
}

.modal-card {
  width: min(560px, 100%);
  border: 1px solid var(--color-modal-border);
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    var(--color-surface-glass),
    var(--color-surface-glass-muted)
  );
  box-shadow: 0 28px 80px var(--shadow-modal-color);
  padding: 24px;
}

.modal-card--wide {
  width: min(820px, 100%);
}

.modal-head,
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
}

.modal-kicker {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-subtitle {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.modal-close {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-control-bg);
  cursor: pointer;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.contact-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
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
.field select {
  min-height: 46px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-white);
  color: var(--color-text-main);
  font: inherit;
}

@media (max-width: 900px) {
  .grid--individual {
    grid-template-columns: 1fr;
  }

  .message-detail {
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

  .contact-panel__controls .btn,
  .contact-search {
    width: 100%;
    flex-basis: 100%;
  }

  .contact-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .contact-row__meta {
    grid-column: 2;
    max-width: none;
  }

  .modal-backdrop {
    align-items: flex-end;
    padding: 12px;
  }

  .modal-card {
    max-height: 88vh;
    overflow: auto;
    border-radius: 16px 16px 12px 12px;
  }

  .contact-form-grid {
    grid-template-columns: 1fr;
  }

  .field--wide {
    grid-column: auto;
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
