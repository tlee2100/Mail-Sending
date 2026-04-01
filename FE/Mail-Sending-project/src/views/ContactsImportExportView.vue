<template>
  <section class="content__header">
    <h1 class="page-title">Contacts Import & Export</h1>
    <p class="page-subtitle">
      Bulk upload contacts from files and export your filtered audience.
    </p>
  </section>

  <section class="grid grid--two">
    <article class="card panel">
      <h2 class="section-title">Import Contacts</h2>
      <p class="muted">
        Supports .csv and .xlsx files using field name file for multipart
        upload.
      </p>

      <div class="input-wrap">
        <label for="file">Choose file</label>
        <input
          id="file"
          type="file"
          accept=".csv,.xlsx"
          @change="onFileChange"
        />
      </div>

      <div class="input-wrap">
        <label for="mode">Import mode</label>
        <select id="mode" v-model="importMode">
          <option value="append">Append new contacts</option>
          <option value="replace">Replace matching email</option>
        </select>
      </div>

      <button type="button" class="btn btn--primary" :disabled="!selectedFile">
        Upload to /contacts/import
      </button>

      <p class="file-name" v-if="selectedFile">
        Selected: {{ selectedFile.name }}
      </p>
    </article>

    <article class="card panel">
      <h2 class="section-title">Export Contacts</h2>
      <p class="muted">
        Generate CSV or XLSX with current filters for external processing.
      </p>

      <div class="input-wrap">
        <label for="export-format">Format</label>
        <select id="export-format" v-model="format">
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
        </select>
      </div>

      <div class="filters">
        <span class="chip">status: active</span>
        <span class="chip">tag: newsletter</span>
      </div>

      <button type="button" class="btn btn--secondary">
        Download from /contacts/export?format={{ format }}
      </button>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const importMode = ref("append");
const format = ref<"csv" | "xlsx">("csv");
const selectedFile = ref<File | null>(null);

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
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

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0 18px;
}

.chip {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg-muted);
  color: var(--color-text-main);
  font-size: 12px;
}

@media (max-width: 900px) {
  .grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
