<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Contact Custom Fields</h1>
      <p class="page-subtitle">
        Create, edit and remove extra attributes for contacts.
      </p>
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
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in fields" :key="field.id">
            <td>{{ field.name }}</td>
            <td>{{ field.type }}</td>
            <td>{{ field.required ? "Yes" : "No" }}</td>
            <td>{{ mockWorkspace.formatRelativeTime(field.updatedAt) }}</td>
            <td class="actions">
              <button type="button" class="btn btn--secondary btn--small" @click="editField(field.id)">
                PATCH
              </button>
              <button type="button" class="btn btn--danger btn--small" @click="removeField(field.id)">
                DELETE
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace, type MockFieldType } from "../stores/mockWorkspace";

const notice = useNotice();
const fields = computed(() => mockWorkspace.state.fields);

function askFieldType(current: MockFieldType = "text") {
  const type = window.prompt("Field type: text, select, date, number", current);
  if (
    type === "text" ||
    type === "select" ||
    type === "date" ||
    type === "number"
  ) {
    return type;
  }
  return null;
}

function addField() {
  const name = window.prompt("Field name", "Region");
  if (!name?.trim()) return;
  const type = askFieldType();
  if (!type) return;
  const required = window.confirm("Mark this field as required?");
  const field = mockWorkspace.addField({ name, type, required });
  notice.show(`Field "${field.name}" created.`, "success");
}

function editField(id: string) {
  const field = fields.value.find((item) => item.id === id);
  if (!field) return;
  const name = window.prompt("Field name", field.name);
  if (!name?.trim()) return;
  const type = askFieldType(field.type);
  if (!type) return;
  const required = window.confirm("Keep this field required?");
  mockWorkspace.updateField(id, {
    name,
    type,
    required,
  });
  notice.show(`Field "${name}" updated.`, "success");
}

function removeField(id: string) {
  const field = fields.value.find((item) => item.id === id);
  if (!field) return;
  if (!window.confirm(`Delete field "${field.name}"?`)) return;
  mockWorkspace.deleteField(id);
  notice.show(`Field "${field.name}" removed.`, "info");
}
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
</style>
