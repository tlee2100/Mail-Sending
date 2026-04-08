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
      <div class="input-wrap" v-for="field in fields" :key="field.fieldId">
        <label :for="`field-${field.fieldId}`">
          {{ field.fieldLabel || field.fieldName }}
        </label>
        <input
          :id="`field-${field.fieldId}`"
          v-model="field.valueText"
          type="text"
          :placeholder="field.fieldType"
        />
      </div>

      <div class="actions">
        <button type="button" class="btn btn--secondary" @click="loadFields">
          Load
        </button>
        <button type="button" class="btn btn--primary" @click="saveFields">
          Save
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
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

async function loadFields() {
  if (!auth.state.token) return;
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
  }
}

async function saveFields() {
  if (!auth.state.token) return;
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

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
