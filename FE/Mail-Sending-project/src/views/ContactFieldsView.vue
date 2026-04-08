<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Contact Custom Fields</h1>
      <p class="page-subtitle">Dynamic fields loaded from backend</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="addField">
      + Add Field
    </button>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table" v-if="fields.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Label</th>
            <th>Type</th>
            <th>Required</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in fields" :key="field.id">
            <td>{{ field.field_name }}</td>
            <td>{{ field.field_label || "-" }}</td>
            <td>{{ field.field_type }}</td>
            <td>{{ field.is_required ? "Yes" : "No" }}</td>
            <td class="actions">
              <button type="button" class="btn btn--secondary btn--small" @click="editField(field)">
                PATCH
              </button>
              <button type="button" class="btn btn--danger btn--small" @click="removeField(field.id)">
                DELETE
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-text">No dynamic fields found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type FieldRow = {
  id: number;
  field_name: string;
  field_label?: string | null;
  field_type: "text" | "number" | "date" | "boolean" | "url";
  is_required: boolean;
};

const notice = useNotice();
const fields = ref<FieldRow[]>([]);

function askFieldType(
  current: FieldRow["field_type"] = "text",
): FieldRow["field_type"] | null {
  const value = window.prompt("Field type: text, number, date, boolean, url", current);
  if (
    value === "text" ||
    value === "number" ||
    value === "date" ||
    value === "boolean" ||
    value === "url"
  ) {
    return value;
  }
  return null;
}

async function loadFields() {
  if (!auth.state.token) return;
  try {
    const response = await contactsApi.listFields(auth.state.token);
    fields.value = response.data as FieldRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load fields";
    notice.show(message, "error");
  }
}

async function addField() {
  if (!auth.state.token) return;
  const fieldName = window.prompt("Field name (snake_case or camelCase)", "region");
  if (!fieldName?.trim()) return;
  const fieldLabel = window.prompt("Field label", "Region") || undefined;
  const fieldType = askFieldType();
  if (!fieldType) return;
  const isRequired = window.confirm("Mark this field as required?");

  try {
    await contactsApi.createField(auth.state.token, {
      fieldName: fieldName.trim(),
      fieldLabel,
      fieldType,
      isRequired,
    });
    notice.show("Field created.", "success");
    await loadFields();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to create field";
    notice.show(message, "error");
  }
}

async function editField(field: FieldRow) {
  if (!auth.state.token) return;
  const fieldName = window.prompt("Field name", field.field_name);
  if (!fieldName?.trim()) return;
  const fieldLabel = window.prompt("Field label", field.field_label || "") || undefined;
  const fieldType = askFieldType(field.field_type);
  if (!fieldType) return;
  const isRequired = window.confirm("Keep this field required?");

  try {
    await contactsApi.updateField(auth.state.token, field.id, {
      fieldName: fieldName.trim(),
      fieldLabel,
      fieldType,
      isRequired,
    });
    notice.show("Field updated.", "success");
    await loadFields();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to update field";
    notice.show(message, "error");
  }
}

async function removeField(id: number) {
  if (!auth.state.token || !window.confirm("Delete this field?")) return;
  try {
    await contactsApi.deleteField(auth.state.token, id);
    notice.show("Field deleted.", "success");
    await loadFields();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to delete field";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadFields();
});
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.card--table {
  border: 1px solid var(--color-border-subtle);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 13px;
  color: var(--color-text-main);
}

.table th {
  color: var(--color-text-muted);
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn--small {
  padding: 6px 10px;
  font-size: 12px;
}

.empty-text {
  padding: 18px;
  color: var(--color-text-muted);
}
</style>
