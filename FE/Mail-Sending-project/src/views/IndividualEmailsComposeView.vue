<template>
  <section class="content__header">
    <h1 class="page-title">✉️ Compose Email</h1>
    <p class="page-subtitle">Compose your email with subject, content and optional template.</p>
  </section>

  <div class="compose-layout">
    <div class="compose-main">
      <div class="card card--compose">
        <div class="compose-actions">
          <button type="button" class="btn btn--yellow">⚡ Select Template</button>
          <button type="button" class="btn btn--primary">✉ Use Email Editor</button>
        </div>

        <div class="input-wrap">
          <label>Email Subject *</label>
          <input v-model="subject" type="text" placeholder="Enter your email subject line." />
        </div>

        <div class="input-wrap">
          <label>Email Content *</label>
          <div class="editor-toolbar">
            <select class="editor-select"><option>Paragraph</option></select>
            <select class="editor-select"><option>Plus Jakarta Sans</option></select>
            <select class="editor-select"><option>14px</option></select>
            <button type="button" class="toolbar-btn">B</button>
            <button type="button" class="toolbar-btn">I</button>
            <button type="button" class="toolbar-btn">U</button>
            <button type="button" class="toolbar-btn">S</button>
            <button type="button" class="toolbar-btn">⋯</button>
          </div>
          <textarea
            v-model="content"
            placeholder="Compose your email message here."
            rows="12"
            class="editor-area"
          ></textarea>
          <p class="editor-hint">Use the rich text editor to format your email with colors, fonts, and styling.</p>
          <p class="word-count">{{ wordCount }} words</p>
        </div>
      </div>

      <div class="compose-footer">
        <button type="button" class="btn btn--secondary">⚠ Reset Form</button>
        <button type="button" class="btn btn--primary">✓ Send Emails</button>
      </div>
    </div>

    <aside class="compose-sidebar">
      <div class="card card--sidebar">
        <h3 class="sidebar-title">👁 Send Preview Email</h3>
        <div class="input-wrap">
          <input v-model="previewEmail" type="email" placeholder="your-email@example.com" />
        </div>
        <button type="button" class="btn btn--green full">Gửi Preview</button>
        <p class="sidebar-hint">Gửi email xem trước để kiểm tra trước khi gửi</p>
      </div>

      <div class="card card--sidebar">
        <h3 class="sidebar-title">Merge Tags</h3>
        <ul class="merge-tags">
          <li v-for="m in mergeTags" :key="m.tag"><code>{{ m.tag }}</code> – {{ m.desc }}</li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const subject = ref('')
const content = ref('')
const previewEmail = ref('')
const mergeTags = [
  { tag: '{{name}}', desc: 'Customer Name' },
  { tag: '{{email}}', desc: 'Email Address' },
  { tag: '{{phone}}', desc: 'Phone Number' },
]

const wordCount = computed(() => {
  const t = content.value.trim()
  return t ? t.split(/\s+/).filter(Boolean).length : 0
})
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
  width: 32px;
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
