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
        <div class="compose-actions">
          <button type="button" class="btn btn--yellow" @click="selectTemplate">
            Select Template
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
        <button type="button" class="btn btn--primary" @click="sendEmails">
          Send Emails
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
        <button type="button" class="btn btn--green full" @click="sendPreview">
          Send Preview
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
import { computed, ref, watch } from "vue";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const editorRef = ref<HTMLTextAreaElement | null>(null);
const subject = ref(mockWorkspace.state.composeDraft.subject);
const content = ref(mockWorkspace.state.composeDraft.content);
const previewEmail = ref(mockWorkspace.state.composeDraft.previewEmail);
const recipients = ref(mockWorkspace.state.composeDraft.recipients);

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

watch([subject, content, previewEmail], () => {
  mockWorkspace.saveComposeDraft({
    recipients: recipients.value,
    subject: subject.value,
    content: content.value,
    previewEmail: previewEmail.value,
  });
});

function selectTemplate() {
  const template = mockWorkspace.state.templates[0];
  if (!template) {
    notice.show("No templates available in mock storage.", "error");
    return;
  }
  subject.value = `${template.name} Update`;
  content.value = `Hi {{name}},\n\nThis message is based on the ${template.name} template.\n\n${template.description}\n\nBest regards,\nYour team`;
  notice.show(`Loaded template "${template.name}".`, "success");
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
  mockWorkspace.resetComposeDraft();
  recipients.value = mockWorkspace.state.composeDraft.recipients;
  notice.show("Compose form reset.", "info");
}

function sendEmails() {
  if (!subject.value.trim() || !content.value.trim()) {
    notice.show("Subject and content are required.", "error");
    return;
  }
  if (!recipients.value.trim()) {
    notice.show("Add recipients in the previous step first.", "error");
    return;
  }
  const campaign = mockWorkspace.sendIndividualEmails({
    recipients: recipients.value,
    subject: subject.value,
    content: content.value,
  });
  notice.show(`Sent mock email batch via campaign "${campaign.name}".`, "success");
}

function sendPreview() {
  if (!previewEmail.value.trim()) {
    notice.show("Preview email is required.", "error");
    return;
  }
  mockWorkspace.sendPreview(previewEmail.value);
  notice.show(`Preview sent to ${previewEmail.value}.`, "success");
}
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
}
</style>
