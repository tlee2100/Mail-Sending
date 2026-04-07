<template>
  <section class="content__header">
    <h1 class="page-title">Contact Field Values</h1>
    <p class="page-subtitle">
      Contact ID: {{ route.params.id }} - Update per-contact field values.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="content__section">
    <div class="card form-card">
      <div class="input-wrap" v-for="field in fields" :key="field.key">
        <label :for="field.key">{{ field.label }}</label>
        <input
          :id="field.key"
          v-model="field.value"
          type="text"
          :placeholder="field.placeholder"
        />
      </div>

      <div class="actions">
        <button type="button" class="btn btn--secondary" @click="loadContactFields">
          Load Contact Fields
        </button>
        <button type="button" class="btn btn--primary" @click="saveContactFields">
          Save Contact Fields
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRoute } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const route = useRoute();
const notice = useNotice();

const fields = reactive([
  { key: "company", label: "Company", value: "", placeholder: "Acme Inc." },
  { key: "plan", label: "Plan", value: "", placeholder: "Enterprise" },
  { key: "renewal_date", label: "Renewal Date", value: "", placeholder: "2026-12-31" },
]);

function loadContactFields() {
  const contact = mockWorkspace.getContactById(String(route.params.id));
  if (!contact) {
    notice.show("Contact not found in mock data.", "error");
    return;
  }
  for (const field of fields) {
    field.value = contact.fields[field.key] || "";
  }
  notice.show(`Loaded field values for ${contact.name}.`, "info");
}

function saveContactFields() {
  const contact = mockWorkspace.updateContactFields(
    String(route.params.id),
    Object.fromEntries(fields.map((field) => [field.key, field.value])),
  );
  if (!contact) {
    notice.show("Contact not found in mock data.", "error");
    return;
  }
  notice.show(`Saved custom fields for ${contact.name}.`, "success");
}

loadContactFields();
</script>

<style scoped>
.form-card {
  border: 1px solid var(--color-border-subtle);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
