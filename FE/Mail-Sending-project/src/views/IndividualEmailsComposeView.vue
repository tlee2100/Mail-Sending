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
          <button
            type="button"
            class="btn btn--primary"
            :disabled="isEditorStarterDisabled"
            :title="editorStarterTitle"
            @click="useEditorStarter"
          >
            Use Email Editor
          </button>
        </div>

        <section class="contact-picker">
          <div class="contact-picker__head">
            <div>
              <h2 class="contact-picker__title">Recipient Contacts</h2>
              <p class="contact-picker__hint">
                Choose contacts from your saved list. Their email addresses
                become recipients for merge-tag personalization.
              </p>
            </div>
            <span class="contact-picker__count">
              {{ selectedContactIds.length }} selected
            </span>
          </div>

          <div class="contact-picker__controls">
            <input
              v-model="contactSearch"
              type="search"
              placeholder="Search contacts by name, email, company, or city"
              class="contact-picker__search"
            />
            <button
              type="button"
              class="btn btn--secondary"
              @click="selectVisibleContacts"
            >
              Select visible
            </button>
            <button
              type="button"
              class="btn btn--secondary"
              @click="clearSelectedContacts"
            >
              Clear
            </button>
            <button
              type="button"
              class="btn btn--primary"
              @click="applySelectedContacts"
            >
              Use selected contacts
            </button>
          </div>

          <div v-if="filteredContacts.length" class="contact-picker__list">
            <label
              v-for="contact in filteredContacts"
              :key="String(contact.id)"
              class="contact-option"
            >
              <input
                v-model="selectedContactIds"
                type="checkbox"
                :value="String(contact.id)"
              />
              <span class="contact-option__main">
                <strong>{{ contactDisplayName(contact) }}</strong>
                <small>{{ contact.email }}</small>
              </span>
              <span class="contact-option__meta">
                {{
                  contact.company ||
                  contact.city ||
                  contact.email_status ||
                  "contact"
                }}
              </span>
            </label>
          </div>
          <div v-else class="contact-picker__empty">
            No contacts found. Add contacts in Email Contacts first.
          </div>

          <div class="input-wrap">
            <label>Recipients *</label>
            <textarea
              v-model="recipients"
              rows="4"
              placeholder="Select contacts above, or paste emails separated by comma, semicolon, or new lines."
            ></textarea>
          </div>
        </section>

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
            <button
              type="button"
              class="toolbar-btn"
              @click="wrapSelection('**', '**')"
            >
              B
            </button>
            <button
              type="button"
              class="toolbar-btn"
              @click="wrapSelection('*', '*')"
            >
              I
            </button>
            <button
              type="button"
              class="toolbar-btn"
              @click="wrapSelection('__', '__')"
            >
              U
            </button>
            <button
              type="button"
              class="toolbar-btn"
              @click="wrapSelection('~~', '~~')"
            >
              S
            </button>
            <button type="button" class="toolbar-btn" @click="insertMergeTag">
              Vars
            </button>
          </div>
          <textarea
            ref="editorRef"
            v-model="content"
            placeholder="Compose your email message here."
            rows="12"
            class="editor-area"
          ></textarea>
          <p class="editor-hint">
            Recipients ready: {{ recipientCount }} | Use merge tags for
            personalization.
          </p>
          <p class="word-count">{{ wordCount }} words</p>
        </div>

        <AIMediaGenerator
          :token="auth.state.token"
          @insert-image="insertAiImageHtml"
          @insert-html="insertAiHtml"
        />
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
            <button
              type="button"
              class="merge-tag-btn"
              @click="appendText(m.tag)"
            >
              <code>{{ m.tag }}</code> - {{ m.desc }}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  </div>

  <div
    v-if="sendSuccessPopup.visible"
    class="success-popup-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="send-success-title"
    @click.self="closeSendSuccessPopup"
  >
    <div class="success-popup-card">
      <div class="success-popup-icon">✓</div>
      <h2 id="send-success-title">Sending Successful</h2>
      <p>{{ sendSuccessPopup.message }}</p>
      <button
        type="button"
        class="btn btn--primary"
        @click="closeSendSuccessPopup"
      >
        OK
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { contactsApi } from "../api/contactsApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import type { AiImageResult } from "../api/aiMediaApi";
import { ApiClientError } from "../api/http";
import { individualEmailsApi } from "../api/individualEmailsApi";
import {
  templateDesignerApi,
  type TemplateLayout,
} from "../api/templateDesignerApi";
import { templatesApi } from "../api/templatesApi";
import AIMediaGenerator from "../components/AIMediaGenerator.vue";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  parseRecipientInput,
  readIndividualEmailDraft,
  resetIndividualEmailDraft,
  writeIndividualEmailDraft,
} from "../utils/individualEmailDraft";
import { canManageTemplate } from "../utils/templateOwnership";

const notice = useNotice();
const router = useRouter();
const draft = readIndividualEmailDraft();
const editorRef = ref<HTMLTextAreaElement | null>(null);
const subject = ref(draft.subject);
const content = ref(draft.content);
const previewEmail = ref(draft.previewEmail);
const recipients = ref(draft.recipients);
const selectedAccountId = ref(draft.emailAccountId);
const selectedTemplateId = ref(draft.templateId);
const accounts = ref<Array<Record<string, unknown>>>([]);
const contacts = ref<Array<Record<string, unknown>>>([]);
const templates = ref<Array<Record<string, unknown>>>([]);
const contactSearch = ref("");
const selectedContactIds = ref<string[]>([]);
const isSending = ref(false);
const isPreviewing = ref(false);
const templateHtmlContent = ref("");
const loadedTemplatePlainContent = ref("");
const sendSuccessPopup = ref({
  visible: false,
  message: "",
});

const mergeTags = [
  { tag: "{{name}}", desc: "Name" },
  { tag: "{{email}}", desc: "Email Address" },
  { tag: "{{first_name}}", desc: "First Name" },
  { tag: "{{firstName}}", desc: "First Name" },
  { tag: "{{last_name}}", desc: "Last Name" },
  { tag: "{{lastName}}", desc: "Last Name" },
  { tag: "{{full_name}}", desc: "Full Name" },
  { tag: "{{fullName}}", desc: "Full Name" },
  { tag: "{{phone}}", desc: "Phone Number" },
  { tag: "{{company}}", desc: "Company" },
  { tag: "{{city}}", desc: "City" },
  { tag: "{{country}}", desc: "Country" },
  { tag: "{{language}}", desc: "Language" },
  { tag: "{{source}}", desc: "Source" },
  { tag: "{{unsubscribe_url}}", desc: "Unsubscribe Link" },
];

type AiImageInsertPayload = AiImageResult & {
  emailWidth: number;
};

type AiHtmlInsertPayload = {
  type: "video";
  html: string;
  url?: string;
};

const wordCount = computed(() => {
  const text = content.value.trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
});

const recipientCount = computed(
  () =>
    recipients.value
      .split(/[\n,;]/)
      .map((value) => value.trim())
      .filter(Boolean).length,
);
const filteredContacts = computed(() => {
  const query = contactSearch.value.trim().toLowerCase();
  return contacts.value.filter((contact) => {
    if (!query) return true;
    return [
      contactDisplayName(contact),
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
const selectedContactEmails = computed(() => {
  const selected = new Set(selectedContactIds.value);
  return contacts.value
    .filter((contact) => selected.has(String(contact.id || "")))
    .map((contact) => String(contact.email || "").trim())
    .filter(Boolean);
});
const selectedTemplate = computed(
  () =>
    templates.value.find(
      (template) => String(template.id || "") === selectedTemplateId.value,
    ) || null,
);
const canEditSelectedTemplate = computed(
  () =>
    !selectedTemplate.value ||
    canManageTemplate(selectedTemplate.value, auth.state.user),
);
const isEditorStarterDisabled = computed(
  () => !!selectedTemplateId.value && !canEditSelectedTemplate.value,
);
const editorStarterTitle = computed(() =>
  isEditorStarterDisabled.value
    ? "Only the template owner can edit this template."
    : "",
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

watch(selectedTemplateId, (value, previousValue) => {
  if (value !== previousValue) {
    templateHtmlContent.value = "";
    loadedTemplatePlainContent.value = "";
  }
});

function stripHtml(value: unknown) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderPlainTextEmailHtml(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const bodyHtml = paragraphs.length
    ? paragraphs
        .map((paragraph) => {
          const lines = escapeHtmlText(paragraph).replace(/\n/g, "<br />");
          return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">${lines}</p>`;
        })
        .join("")
    : `<p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">${escapeHtmlText(value)}</p>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;">
      <tr>
        <td align="center" style="padding:28px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function hasEditedLoadedTemplateContent() {
  if (!selectedTemplateId.value) return false;
  if (!loadedTemplatePlainContent.value) return true;
  return content.value.trim() !== loadedTemplatePlainContent.value.trim();
}

function resolveDefaultAccountId(rows: Array<Record<string, unknown>>) {
  const defaultAccount =
    rows.find((item) => item.is_default === true) || rows[0];
  return defaultAccount ? String(defaultAccount.id || "") : "";
}

function accountExists(
  accountId: string,
  rows: Array<Record<string, unknown>>,
) {
  return rows.some((item) => String(item.id || "") === accountId);
}

function contactDisplayName(contact: Record<string, unknown>) {
  const firstName = String(
    contact.first_name || contact.firstName || "",
  ).trim();
  const lastName = String(contact.last_name || contact.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  return fullName || String(contact.email || "Unknown contact");
}

function syncContactSelectionFromRecipients() {
  const recipientEmails = new Set(parseRecipientInput(recipients.value));
  selectedContactIds.value = contacts.value
    .filter((contact) =>
      recipientEmails.has(
        String(contact.email || "")
          .trim()
          .toLowerCase(),
      ),
    )
    .map((contact) => String(contact.id || ""))
    .filter(Boolean);
}

function selectVisibleContacts() {
  const next = new Set(selectedContactIds.value);
  filteredContacts.value.forEach((contact) => {
    const id = String(contact.id || "");
    if (id) next.add(id);
  });
  selectedContactIds.value = [...next];
}

function clearSelectedContacts() {
  selectedContactIds.value = [];
}

function applySelectedContacts() {
  if (!selectedContactEmails.value.length) {
    notice.show("Select at least one contact first.", "error");
    return;
  }
  recipients.value = selectedContactEmails.value.join("\n");
  notice.show(
    `${selectedContactEmails.value.length} contact recipient(s) selected.`,
    "success",
  );
}

async function loadDependencies() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  try {
    const [accountsRes, templatesRes, contactsRes] = await Promise.all([
      emailAccountsApi.list(auth.state.token),
      templatesApi.listTemplates(auth.state.token, { pageSize: 100 }),
      contactsApi.listContacts(auth.state.token, {
        pageSize: 20,
        status: "active",
      }),
    ]);

    accounts.value = accountsRes.data || [];
    templates.value = templatesRes.data.items || [];
    contacts.value = contactsRes.data.items || [];
    syncContactSelectionFromRecipients();

    if (
      !selectedAccountId.value ||
      !accountExists(selectedAccountId.value, accounts.value)
    ) {
      selectedAccountId.value = resolveDefaultAccountId(accounts.value);
    }
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load compose data";
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
    subject.value = String(
      template.subject || template.template_name || "",
    ).trim();
    content.value =
      String(template.content_text || "").trim() ||
      stripHtml(template.content_html);
    templateHtmlContent.value = String(template.content_html || "").trim();
    loadedTemplatePlainContent.value = content.value;
    notice.show(
      `Loaded template "${String(template.template_name || "Template")}".`,
      "success",
    );
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : "Failed to load template";
    notice.show(message, "error");
  }
}

async function resolveHtmlContentForDelivery() {
  if (hasHtml(content.value)) {
    return content.value;
  }

  if (!selectedTemplateId.value || hasEditedLoadedTemplateContent()) {
    return renderPlainTextEmailHtml(content.value);
  }

  if (!auth.state.token || !selectedTemplateId.value) {
    return renderPlainTextEmailHtml(content.value);
  }

  try {
    const designer = await templateDesignerApi.getDesigner(
      selectedTemplateId.value,
      auth.state.token,
    );
    const renderedDesignerHtml = designer.renderedHtml || "";

    if (renderedDesignerHtml.trim()) {
      templateHtmlContent.value = renderedDesignerHtml;
      return renderedDesignerHtml;
    }
  } catch {
    // fallback to template content_html below
  }

  if (templateHtmlContent.value.trim()) {
    return templateHtmlContent.value;
  }

  try {
    const response = await templatesApi.getTemplate(
      auth.state.token,
      Number(selectedTemplateId.value),
    );
    const html = String(response.data.content_html || "").trim();
    templateHtmlContent.value = html;
    return html || undefined;
  } catch {
    return undefined;
  }
}

function buildDesignerLayoutFromComposeBody(body: string): TemplateLayout {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const blocks =
    paragraphs.length > 0
      ? paragraphs.map((paragraph, index) => ({
          type: "text",
          props: {
            content: paragraph,
            fontSize: index === 0 ? "18" : "16",
            color: "#334155",
            align: "left",
          },
        }))
      : [
          {
            type: "text",
            props: {
              content:
                "Hi {{name}},\n\nThanks for being part of our audience.\n\nWrite your message here.\n\nBest regards,\nYour team",
              fontSize: "16",
              color: "#334155",
              align: "left",
            },
          },
        ];

  return {
    root: {
      type: "section",
      children: blocks as TemplateLayout["root"]["children"],
    },
  };
}

async function useEditorStarter() {
  if (!auth.state.token) return;
  if (isEditorStarterDisabled.value) {
    notice.show("Only the template owner can edit this template.", "error");
    return;
  }

  const token = auth.state.token;

  try {
    let nextTemplateId = selectedTemplateId.value;

    if (!nextTemplateId) {
      const nextTemplateName =
        subject.value.trim() ||
        `Compose Draft ${new Date().toLocaleDateString()}`;

      const created = await templatesApi.createTemplate(token, {
        templateName: nextTemplateName,
        subject: subject.value.trim() || nextTemplateName,
        contentText: content.value.trim() || undefined,
        isActive: true,
      });

      nextTemplateId = String(created.data.id || "");
      if (!nextTemplateId) {
        throw new Error("Template creation did not return an id");
      }

      await templateDesignerApi.saveDraft(nextTemplateId, token, {
        layout: buildDesignerLayoutFromComposeBody(content.value),
      });

      selectedTemplateId.value = nextTemplateId;
      notice.show(
        "Created a new template draft and opened Email Editor.",
        "success",
      );
    } else {
      notice.show("Opening Email Editor for the selected template.", "info");
    }

    await router.push({
      name: "template-designer",
      params: { id: nextTemplateId },
      query: { from: "compose" },
    });
  } catch (error) {
    const message =
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to open Email Editor";
    notice.show(message, "error");
  }
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

function insertTextAtCursor(text: string) {
  const element = editorRef.value;
  if (!element) {
    const separator = content.value.trim() ? "\n\n" : "";
    content.value = `${content.value}${separator}${text}`;
    return;
  }

  const start = element.selectionStart ?? content.value.length;
  const end = element.selectionEnd ?? content.value.length;
  const before = content.value.slice(0, start);
  const after = content.value.slice(end);
  const separator = before.trim() && !before.endsWith("\n\n") ? "\n\n" : "";
  const inserted = `${separator}${text}`;

  content.value = `${before}${inserted}${after}`;

  window.requestAnimationFrame(() => {
    element.focus();
    const cursor = start + inserted.length;
    element.setSelectionRange(cursor, cursor);
  });
}

function buildImageHtml(result: AiImageInsertPayload) {
  const width = Number.isFinite(result.emailWidth) ? result.emailWidth : 600;
  return `<img src="${escapeHtmlAttribute(result.url)}" alt="${escapeHtmlAttribute(result.altText || "")}" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;" />`;
}

function insertAiImageHtml(result: AiImageInsertPayload) {
  insertTextAtCursor(result.emailHtml || buildImageHtml(result));
  notice.show("Đã chèn ảnh AI vào email.", "success");
}

function insertAiHtml(payload: AiHtmlInsertPayload) {
  insertTextAtCursor(payload.html);
  notice.show("Đã chèn video AI vào email.", "success");
}

function resetForm() {
  subject.value = "";
  content.value = "";
  previewEmail.value = "";
  selectedTemplateId.value = "";
  templateHtmlContent.value = "";
  loadedTemplatePlainContent.value = "";
  resetIndividualEmailDraft();
  recipients.value = "";
  selectedAccountId.value = resolveDefaultAccountId(accounts.value);
  notice.show("Compose form reset.", "info");
}

function closeSendSuccessPopup() {
  sendSuccessPopup.value.visible = false;
}

function showSendSuccessPopup(sentCount: number) {
  sendSuccessPopup.value = {
    visible: true,
    message: `${sentCount} email${sentCount === 1 ? "" : "s"} sent successfully.`,
  };
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
    const htmlContent = await resolveHtmlContentForDelivery();
    const response = await individualEmailsApi.send(auth.state.token, {
      recipients: parsedRecipients,
      subject: subject.value.trim(),
      content: content.value,
      htmlContent,
      emailAccountId: Number(selectedAccountId.value),
    });
    const sentCount = Number(response.data.sentCount || 0);
    const requestedCount = Number(
      response.data.requestedCount || parsedRecipients.length,
    );
    const failedCount = Number(response.data.failedCount || 0);

    if (failedCount === 0 && sentCount > 0) {
      showSendSuccessPopup(sentCount);
    } else {
      notice.show(
        `Sent ${sentCount}/${requestedCount} emails via backend SMTP. Failed: ${failedCount}.`,
        "info",
      );
    }
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
    const htmlContent = await resolveHtmlContentForDelivery();
    await individualEmailsApi.sendPreview(auth.state.token, {
      previewEmail: previewEmail.value.trim(),
      subject: subject.value.trim(),
      content: content.value,
      htmlContent,
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

.contact-picker {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-bg-surface-soft);
}

.contact-picker__head,
.contact-picker__controls {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.contact-picker__title {
  margin: 0 0 4px;
  color: var(--color-text-main);
  font-size: 16px;
}

.contact-picker__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.contact-picker__count {
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-primary-bg-soft);
  color: var(--color-primary-text);
  font-size: 12px;
  font-weight: 800;
}

.contact-picker__search {
  flex: 1 1 280px;
  min-height: 40px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
  font: inherit;
}

.contact-picker__list {
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow: auto;
  padding-right: 4px;
}

.contact-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-control-bg);
}

.contact-option__main {
  display: grid;
  min-width: 0;
}

.contact-option__main strong,
.contact-option__main small,
.contact-option__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-option__main strong {
  color: var(--color-text-main);
  font-size: 13px;
}

.contact-option__main small,
.contact-option__meta,
.contact-picker__empty {
  color: var(--color-text-muted);
  font-size: 12px;
}

.contact-option__meta {
  max-width: 180px;
  font-weight: 700;
}

.contact-picker__empty {
  padding: 14px;
  border: 1px dashed var(--color-border-subtle);
  border-radius: 10px;
  text-align: center;
}

.btn--yellow {
  background: var(--color-warning-soft);
  color: var(--color-warning-text-strong);
}

.btn--green {
  background: var(--color-success);
  color: var(--color-white);
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
  color: var(--color-text-muted);
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
  color: var(--color-text-muted);
  margin-top: 10px;
}

.merge-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  color: var(--color-text-subtle);
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
  background: var(--color-transparent);
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

.success-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(6px);
}

.success-popup-card {
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid var(--color-success-border);
  border-radius: 22px;
  background: var(--color-card-bg);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
  text-align: center;
}

.success-popup-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: var(--color-success-bg);
  color: var(--color-success-text-strong);
  font-size: 30px;
  font-weight: 800;
}

.success-popup-card h2 {
  margin: 0;
  color: var(--color-text-main);
  font-size: 24px;
}

.success-popup-card p {
  margin: 10px 0 22px;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .compose-layout {
    grid-template-columns: 1fr;
  }

  .compose-config {
    grid-template-columns: 1fr;
  }

  .contact-picker__controls .btn,
  .contact-picker__search {
    width: 100%;
    flex-basis: 100%;
  }

  .contact-option {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .contact-option__meta {
    grid-column: 2;
    max-width: none;
  }
}
</style>
