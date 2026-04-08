<template>
  <section class="content__header">
    <h1 class="page-title">Contacts Import & Export</h1>
    <p class="page-subtitle">Backend file import/export for contacts</p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="grid grid--two">
    <article class="card panel">
      <h2 class="section-title">Import Contacts</h2>
      <p class="muted">Upload CSV/XLSX and send it directly to backend import.</p>

      <div class="input-wrap">
        <label for="file">Choose file</label>
        <input id="file" type="file" accept=".csv,.xlsx" @change="onFileChange" />
      </div>

      <div class="input-wrap">
        <label for="mode">Import mode</label>
        <select id="mode" v-model="importMode">
          <option value="insert">Insert only</option>
          <option value="upsert">Upsert by email</option>
        </select>
      </div>

      <button
        type="button"
        class="btn btn--primary"
        :disabled="!selectedFile"
        @click="importContacts"
      >
        Upload
      </button>

      <p class="file-name" v-if="selectedFile">Selected: {{ selectedFile.name }}</p>
    </article>

    <article class="card panel">
      <h2 class="section-title">Export Contacts</h2>
      <p class="muted">Download filtered contacts from backend.</p>

      <div class="input-wrap">
        <label for="export-format">Format</label>
        <select id="export-format" v-model="format">
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
        </select>
      </div>

      <button type="button" class="btn btn--secondary" @click="exportContacts">
        Download Export
      </button>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError, downloadBlob } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const notice = useNotice();
const importMode = ref<"insert" | "upsert">("insert");
const format = ref<"csv" | "xlsx">("csv");
const selectedFile = ref<File | null>(null);

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
}

async function importContacts() {
  if (!auth.state.token || !selectedFile.value) return;
  try {
    const response = await contactsApi.importContacts(
      auth.state.token,
      selectedFile.value,
      importMode.value,
    );
    notice.show(response.message, "success");
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to import contacts";
    notice.show(message, "error");
  }
}

async function exportContacts() {
  if (!auth.state.token) return;
  try {
    const response = await contactsApi.exportContacts(auth.state.token, {
      format: format.value,
    });
    downloadBlob(response.blob, response.fileName);
    notice.show(`Downloaded ${response.fileName}.`, "success");
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to export contacts";
    notice.show(message, "error");
  }
}
</script>

<style scoped>
.grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel {
  border: 1px solid var(--color-border-subtle);
}

.muted {
  margin: 0 0 16px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.file-name {
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-text-soft);
}

@media (max-width: 900px) {
  .grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
