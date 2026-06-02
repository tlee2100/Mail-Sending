<template>
  <section class="content__header">
    <h1 class="page-title">Contact Field Values</h1>
    <p class="page-subtitle">Contact ID: {{ route.params.id }}</p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="content__section">
    <div class="card form-card">
      <div v-if="loading" class="empty-state">
        <h2>Loading custom fields...</h2>
        <p>Please wait while the contact fields are loaded.</p>
      </div>

      <div v-else-if="!fields.length" class="empty-state">
        <h2>No custom fields yet</h2>
        <p>
          Create contact custom fields first, then come back here to enter values for this contact.
        </p>
        <div class="empty-actions">
          <RouterLink v-if="isAdmin" to="/contacts/fields" class="btn btn--primary">
            Create custom fields
          </RouterLink>
          <RouterLink to="/email-contacts" class="btn btn--secondary">
            Back to contacts
          </RouterLink>
        </div>
      </div>

      <div v-for="field in fields" v-else :key="field.fieldId" class="input-wrap">
        <label :for="`field-${field.fieldId}`">
          {{ field.fieldLabel || field.fieldName }}
          <span v-if="field.isRequired" class="required-mark">*</span>
        </label>
        <input
          v-if="field.fieldType !== 'boolean'"
          :id="`field-${field.fieldId}`"
          v-model="field.valueText"
          :type="inputType(field.fieldType)"
          :required="field.isRequired"
          :placeholder="field.fieldType"
        />
        <select v-else :id="`field-${field.fieldId}`" v-model="field.valueText" :required="field.isRequired">
          <option value="">Not set</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>

      <div class="actions">
        <button type="button" class="btn btn--secondary" :disabled="loading" @click="loadFields">
          {{ loading ? "Loading..." : "Load" }}
        </button>
        <button type="button" class="btn btn--primary" :disabled="loading || !fields.length" @click="saveFields">
          Save
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type FieldValueRow = {
  fieldId: number;
  fieldName: string;
  fieldLabel?: string | null;
  fieldType: string;
  isRequired: boolean;
  value: string | number | boolean | null;
  valueText: string;
};

const route = useRoute();
const notice = useNotice();
const fields = ref<FieldValueRow[]>([]);
const loading = ref(false);
const isAdmin = computed(() => auth.state.user?.role === "admin");

function inputType(fieldType: string) {
  if (fieldType === "number" || fieldType === "date" || fieldType === "url") {
    return fieldType;
  }
  return "text";
}

async function loadFields() {
  if (!auth.state.token) return;
  loading.value = true;
  try {
    const response = await contactsApi.listContactFields(
      auth.state.token,
      String(route.params.id),
    );
    fields.value = (response.data as Array<any>).map((item) => ({
      ...item,
      valueText: item.value === null || item.value === undefined ? "" : String(item.value),
    }));
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load field values";
    notice.show(message, "error");
  } finally {
    loading.value = false;
  }
}

async function saveFields() {
  if (!auth.state.token || !fields.value.length) return;
  try {
    await contactsApi.replaceContactFields(
      auth.state.token,
      String(route.params.id),
      fields.value.map((field) => ({
        fieldId: field.fieldId,
        value: field.valueText.trim() ? field.valueText.trim() : null,
      })),
    );
    notice.show("Field values saved.", "success");
    await loadFields();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to save field values";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadFields();
});
</script>

<style scoped>
.form-card {
  border: 1px solid var(--color-border-subtle);
}

.input-wrap select {
  min-height: 46px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-white);
  color: var(--color-text-main);
  font: inherit;
}

.required-mark {
  color: var(--color-danger);
}

.empty-state {
  padding: 24px;
  text-align: center;
}

.empty-state h2 {
  margin: 0 0 8px;
  color: var(--color-text-main);
  font-size: 18px;
}

.empty-state p {
  margin: 0;
  color: var(--color-text-muted);
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
