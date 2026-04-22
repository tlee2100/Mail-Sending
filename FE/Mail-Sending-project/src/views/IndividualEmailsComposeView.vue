<template>
  <section class="content__header">
    <h1 class="page-title">Compose Email</h1>
    <p class="page-subtitle">
      Compose your email with subject, content and optional template.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <div class="compose-layout">
    <div class="compose-main">
      <div class="card card--compose">
        <div class="compose-config">
          <div class="input-wrap">
            <label>Sender Account *</label>
            <select v-model="selectedAccountId">
              <option value="">Select a sender account</option>
              <option
                v-for="account in accounts"
                :key="String(account.id)"
                :value="String(account.id)"
              >
                {{ String(account.email_address || "Unknown account") }}
              </option>
            </select>
          </div>

          <div class="input-wrap">
            <label>Template</label>
            <select v-model="selectedTemplateId">
              <option value="">Manual compose</option>
              <option
                v-for="template in templates"
                :key="String(template.id)"
                :value="String(template.id)"
              >
                {{ String(template.template_name || "Template") }}
              </option>
            </select>
          </div>
        </div>

        <div class="compose-actions">
          <button
            type="button"
            class="btn btn--yellow"
            :disabled="!selectedTemplateId"
            @click="selectTemplate"
          >
            Load Template
          </button>
          <button type="button" class="btn btn--primary" @click="useEditorStarter">
            Use Email Editor
          </button>
        </div>

        <div class="input-wrap">
          <label>Email Subject *</label>
          <input
            v-model="subject"
            type="text"
            placeholder="Enter your email subject line."
          />
        </div>

        <div class="input-wrap">
          <label>Email Content *</label>
          <div class="editor-toolbar">
            <select class="editor-select">
              <option>Paragraph</option>
            </select>
            <select class="editor-select">
              <option>Plus Jakarta Sans</option>
            </select>
            <select class="editor-select">
              <option>14px</option>
            </select>
            <button type="button" class="toolbar-btn" @click="wrapSelection('**', '**')">B</button>
            <button type="button" class="toolbar-btn" @click="wrapSelection('*', '*')">I</button>
            <button type="button" class="toolbar-btn" @click="wrapSelection('__', '__')">U</button>
            <button type="button" class="toolbar-btn" @click="wrapSelection('~~', '~~')">S</button>
            <button type="button" class="toolbar-btn" @click="insertMergeTag">Vars</button>
          </div>
          <textarea
            ref="editorRef"
            v-model="content"
            placeholder="Compose your email message here."
            rows="12"
            class="editor-area"
          ></textarea>
          <p class="editor-hint">
            Recipients ready: {{ recipientCount }} | Use merge tags for personalization.
          </p>
          <p class="word-count">{{ wordCount }} words</p>
        </div>
      </div>

      <div class="compose-footer">
        <button type="button" class="btn btn--secondary" @click="resetForm">
          Reset Form
        </button>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="isSending"
          @click="sendEmails"
        >
          {{ isSending ? "Sending..." : "Send Emails" }}
        </button>
      </div>
    </div>

    <aside class="compose-sidebar">
      <div class="card card--sidebar">
        <h3 class="sidebar-title">Send Preview Email</h3>
        <div class="input-wrap">
          <input
            v-model="previewEmail"
            type="email"
            placeholder="your-email@example.com"
          />
        </div>
        <button
          type="button"
          class="btn btn--green full"
          :disabled="isPreviewing"
          @click="sendPreview"
        >
          {{ isPreviewing ? "Sending..." : "Send Preview" }}
        </button>
        <p class="sidebar-hint">
          Send a preview first to verify the content before bulk send.
        </p>
      </div>

      <div class="card card--sidebar">
        <h3 class="sidebar-title">Merge Tags</h3>
        <ul class="merge-tags">
          <li v-for="m in mergeTags" :key="m.tag">
            <button type="button" class="merge-tag-btn" @click="appendText(m.tag)">
              <code>{{ m.tag }}</code> - {{ m.desc }}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { ApiClientError } from "../api/http";
import { individualEmailsApi } from "../api/individualEmailsApi";
import { templatesApi } from "../api/templatesApi";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  parseRecipientInput,
  readIndividualEmailDraft,
  resetIndividualEmailDraft,
  writeIndividualEmailDraft,
} from "../utils/individualEmailDraft";

const notice = useNotice();
const draft = readIndividualEmailDraft();
const editorRef = ref<HTMLTextAreaElement | null>(null);
const subject = ref(draft.subject);
const content = ref(draft.content);
const previewEmail = ref(draft.previewEmail);
const recipients = ref(draft.recipients);
const selectedAccountId = ref(draft.emailAccountId);
const selectedTemplateId = ref(draft.templateId);
const accounts = ref<Array<Record<string, unknown>>>([]);
const templates = ref<Array<Record<string, unknown>>>([]);
const isSending = ref(false);
const isPreviewing = ref(false);

const mergeTags = [
  { tag: "{{name}}", desc: "Customer Name" },
  { tag: "{{email}}", desc: "Email Address" },
  { tag: "{{phone}}", desc: "Phone Number" },
];

const wordCount = computed(() => {
  const text = content.value.trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
});

const recipientCount = computed(() =>
  recipients.value
    .split(/[\n,;]/)
    .map((value) => value.trim())
    .filter(Boolean).length,
);

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const details = error.details as
      | { reason?: string; results?: Array<{ error?: string }> }
      | undefined;
    const reason =
      details?.reason ||
      details?.results?.find((item) => item.error)?.error ||
      "";
    return reason ? `${error.message}: ${reason}` : error.message;
  }

  return fallback;
}

watch([subject, content, previewEmail], () => {
  writeIndividualEmailDraft({
    recipients: recipients.value,
    subject: subject.value,
    content: content.value,
    previewEmail: previewEmail.value,
    emailAccountId: selectedAccountId.value,
    templateId: selectedTemplateId.value,
  });
});

watch([recipients, selectedAccountId, selectedTemplateId], () => {
  writeIndividualEmailDraft({
    recipients: recipients.value,
    subject: subject.value,
    content: content.value,
    previewEmail: previewEmail.value,
    emailAccountId: selectedAccountId.value,
    templateId: selectedTemplateId.value,
  });
});

function stripHtml(value: unknown) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveDefaultAccountId(rows: Array<Record<string, unknown>>) {
  const defaultAccount = rows.find((item) => item.is_default === true) || rows[0];
  return defaultAccount ? String(defaultAccount.id || "") : "";
}

async function loadDependencies() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  try {
    const [accountsRes, templatesRes] = await Promise.all([
      emailAccountsApi.list(auth.state.token),
      templatesApi.listTemplates(auth.state.token, { pageSize: 100 }),
    ]);

    accounts.value = accountsRes.data || [];
    templates.value = templatesRes.data.items || [];

    if (!selectedAccountId.value) {
      selectedAccountId.value = resolveDefaultAccountId(accounts.value);
    }
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load compose data";
    notice.show(message, "error");
  }
}

async function selectTemplate() {
  if (!auth.state.token) return;
  if (!selectedTemplateId.value) {
    notice.show("Choose a template first.", "error");
    return;
  }

  try {
    const response = await templatesApi.getTemplate(
      auth.state.token,
      Number(selectedTemplateId.value),
    );
    const template = response.data;
    subject.value = String(template.subject || template.template_name || "").trim();
    content.value = String(template.content_text || "").trim() || stripHtml(template.content_html);
    notice.show(`Loaded template "${String(template.template_name || "Template")}".`, "success");
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load template";
    notice.show(message, "error");
  }
}

function useEditorStarter() {
  if (content.value.trim()) {
    content.value += "\n\n---\nCTA: [Add your action here]";
  } else {
    content.value = "Hi {{name}},\n\nThanks for being part of our audience.\n\nWrite your message here.\n\nBest regards,\nYour team";
  }
  notice.show("Inserted editable starter content.", "info");
}

function wrapSelection(prefix: string, suffix: string) {
  const element = editorRef.value;
  if (!element) return;
  const start = element.selectionStart ?? content.value.length;
  const end = element.selectionEnd ?? content.value.length;
  const selected = content.value.slice(start, end) || "text";
  content.value =
    content.value.slice(0, start) +
    prefix +
    selected +
    suffix +
    content.value.slice(end);
}

function insertMergeTag() {
  appendText(" {{name}}");
}

function appendText(text: string) {
  content.value = `${content.value}${text}`;
}

function resetForm() {
  subject.value = "";
  content.value = "";
  previewEmail.value = "";
  selectedTemplateId.value = "";
  resetIndividualEmailDraft();
  recipients.value = "";
  selectedAccountId.value = resolveDefaultAccountId(accounts.value);
  notice.show("Compose form reset.", "info");
}

async function sendEmails() {
  if (!auth.state.token) return;
  if (!subject.value.trim() || !content.value.trim()) {
    notice.show("Subject and content are required.", "error");
    return;
  }
  if (!recipients.value.trim()) {
    notice.show("Add recipients in the previous step first.", "error");
    return;
  }
  if (!selectedAccountId.value) {
    notice.show("Select an email account first.", "error");
    return;
  }

  const parsedRecipients = parseRecipientInput(recipients.value);
  if (parsedRecipients.length === 0) {
    notice.show("Recipients list is empty.", "error");
    return;
  }

  isSending.value = true;
  try {
    const response = await individualEmailsApi.send(auth.state.token, {
      recipients: parsedRecipients,
      subject: subject.value.trim(),
      content: content.value,
      emailAccountId: Number(selectedAccountId.value),
    });
    notice.show(
      `Sent ${response.data.sentCount}/${response.data.requestedCount} emails via backend SMTP.`,
      response.data.failedCount > 0 ? "info" : "success",
    );
  } catch (error) {
    notice.show(getApiErrorMessage(error, "Failed to send emails"), "error");
  } finally {
    isSending.value = false;
  }
}

async function sendPreview() {
  if (!auth.state.token) return;
  if (!previewEmail.value.trim()) {
    notice.show("Preview email is required.", "error");
    return;
  }
  if (!subject.value.trim() || !content.value.trim()) {
    notice.show("Subject and content are required before preview.", "error");
    return;
  }
  if (!selectedAccountId.value) {
    notice.show("Select an email account first.", "error");
    return;
  }

  isPreviewing.value = true;
  try {
    await individualEmailsApi.sendPreview(auth.state.token, {
      previewEmail: previewEmail.value.trim(),
      subject: subject.value.trim(),
      content: content.value,
      emailAccountId: Number(selectedAccountId.value),
    });
    notice.show(`Preview sent to ${previewEmail.value.trim()}.`, "success");
  } catch (error) {
    notice.show(getApiErrorMessage(error, "Failed to send preview"), "error");
  } finally {
    isPreviewing.value = false;
  }
}

onMounted(() => {
  void loadDependencies();
});
</script>

<style scoped>
.compose-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}

.compose-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card--compose {
  padding: 20px;
}

.compose-config {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.compose-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn--yellow {
  background: #facc15;
  color: #422006;
}

.btn--green {
  background: #22c55e;
  color: white;
}

.full {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  padding: 6px 0;
}

.editor-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-border-subtle);
  font-size: 13px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
}

.toolbar-btn {
  min-width: 32px;
  height: 32px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  background: var(--color-control-bg);
  cursor: pointer;
  font-size: 14px;
}

.editor-area {
  min-height: 200px;
}

.editor-hint,
.word-count {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

.compose-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0;
}

.compose-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card--sidebar {
  padding: 18px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
}

.sidebar-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 10px;
}

.merge-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  color: #374151;
}

.merge-tags li {
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.merge-tags li:last-child {
  border-bottom: none;
}

.merge-tag-btn {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  cursor: pointer;
}

.merge-tags code {
  background: var(--color-control-bg-muted);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .compose-layout {
    grid-template-columns: 1fr;
  }

  .compose-config {
    grid-template-columns: 1fr;
  }
}
</style>
