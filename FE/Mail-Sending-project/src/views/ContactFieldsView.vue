<template>
  <section class="content__header header-row">
    <div>
      <p class="eyebrow">Custom profile data</p>
      <h1 class="page-title">Contact Custom Fields</h1>
      <p class="page-subtitle">Create, edit and remove dynamic fields loaded from backend.</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="openCreateModal">
      + Add Field
    </button>
  </section>

  <section class="field-stats">
    <article class="stat-card stat-card--blue">
      <span>Total Fields</span>
      <strong>{{ fields.length }}</strong>
    </article>
    <article class="stat-card stat-card--green">
      <span>Required</span>
      <strong>{{ requiredCount }}</strong>
    </article>
    <article class="stat-card stat-card--purple">
      <span>Optional</span>
      <strong>{{ fields.length - requiredCount }}</strong>
    </article>
  </section>

  <section class="content__section">
    <div v-if="fields.length" class="field-board">
      <article v-for="field in fields" :key="field.id" class="field-card">
        <div>
          <span class="type-pill">{{ field.field_type }}</span>
          <h2>{{ field.field_label || field.field_name }}</h2>
          <p>{{ field.field_name }}</p>
        </div>
        <span class="required-badge" :class="{ 'required-badge--off': !field.is_required }">
          {{ field.is_required ? "Required" : "Optional" }}
        </span>
        <div class="field-actions">
          <button type="button" class="btn btn--secondary btn--small" @click="openEditModal(field)">
            Edit
          </button>
          <button type="button" class="btn btn--danger btn--small" @click="openDeleteModal(field)">
            Delete
          </button>
        </div>
      </article>
    </div>
    <div v-else class="empty-card">
      <h2>No dynamic fields found.</h2>
      <p>Add fields like region, membership level, birthday, or payment status for personalization.</p>
      <button type="button" class="btn btn--primary" @click="openCreateModal">
        Add Field
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <form class="modal-card" @submit.prevent="submitField">
        <header class="modal-head">
          <div>
            <p class="eyebrow">{{ editingField ? "Edit field" : "New field" }}</p>
            <h2 class="modal-title">{{ editingField ? "Update custom field" : "Create custom field" }}</h2>
            <p class="modal-subtitle">Field name is used as the backend key and should be camelCase or snake_case.</p>
          </div>
          <button type="button" class="modal-close" @click="closeModal">x</button>
        </header>

        <div class="form-grid">
          <label class="field">
            <span>Field name *</span>
            <input v-model.trim="form.fieldName" type="text" required placeholder="membershipLevel" />
          </label>
          <label class="field">
            <span>Label</span>
            <input v-model.trim="form.fieldLabel" type="text" placeholder="Membership Level" />
          </label>
          <label class="field">
            <span>Type</span>
            <select v-model="form.fieldType">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
              <option value="url">URL</option>
            </select>
          </label>
          <label class="check-row">
            <input v-model="form.isRequired" type="checkbox" />
            <span>Mark as required</span>
          </label>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn--primary" :disabled="saving">
            {{ saving ? "Saving..." : editingField ? "Save changes" : "Create field" }}
          </button>
        </footer>
      </form>
    </div>

    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <section class="modal-card modal-card--danger">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Delete field</p>
            <h2 class="modal-title">Delete {{ deleteTarget.field_label || deleteTarget.field_name }}?</h2>
            <p class="modal-subtitle">Saved values for this custom field will no longer be usable.</p>
          </div>
          <button type="button" class="modal-close" @click="deleteTarget = null">x</button>
        </header>
        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="deleteTarget = null">Cancel</button>
          <button type="button" class="btn btn--danger" :disabled="saving" @click="deleteField">
            Delete field
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
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
const isModalOpen = ref(false);
const saving = ref(false);
const editingField = ref<FieldRow | null>(null);
const deleteTarget = ref<FieldRow | null>(null);
const form = reactive({
  fieldName: "",
  fieldLabel: "",
  fieldType: "text" as FieldRow["field_type"],
  isRequired: false,
});

const requiredCount = computed(() => fields.value.filter((field) => field.is_required).length);

function resetForm() {
  form.fieldName = "";
  form.fieldLabel = "";
  form.fieldType = "text";
  form.isRequired = false;
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

function openCreateModal() {
  editingField.value = null;
  resetForm();
  isModalOpen.value = true;
}

function openEditModal(field: FieldRow) {
  editingField.value = field;
  form.fieldName = field.field_name;
  form.fieldLabel = field.field_label || "";
  form.fieldType = field.field_type;
  form.isRequired = field.is_required;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

function openDeleteModal(field: FieldRow) {
  deleteTarget.value = field;
}

async function submitField() {
  if (!auth.state.token || saving.value) return;
  saving.value = true;
  try {
    const body = {
      fieldName: form.fieldName,
      fieldLabel: form.fieldLabel || undefined,
      fieldType: form.fieldType,
      isRequired: form.isRequired,
    };

    if (editingField.value) {
      await contactsApi.updateField(auth.state.token, editingField.value.id, body);
      notice.show("Field updated.", "success");
    } else {
      await contactsApi.createField(auth.state.token, body);
      notice.show("Field created.", "success");
    }

    closeModal();
    await loadFields();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to save field";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

async function deleteField() {
  if (!auth.state.token || !deleteTarget.value || saving.value) return;
  saving.value = true;
  try {
    await contactsApi.deleteField(auth.state.token, deleteTarget.value.id);
    notice.show("Field deleted.", "success");
    deleteTarget.value = null;
    await loadFields();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to delete field";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadFields();
});
</script>

<style scoped>
.header-row,
.modal-head,
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 22px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  background: var(--color-bg-surface-elevated);
  box-shadow: var(--shadow-elevated);
}

.stat-card span {
  color: var(--color-text-muted);
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  color: var(--color-text-main);
  font-size: 34px;
}

.stat-card--blue { border-top: 3px solid #3b82f6; }
.stat-card--green { border-top: 3px solid #22c55e; }
.stat-card--purple { border-top: 3px solid #635bff; }

.field-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.field-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 22px;
  background: var(--color-bg-surface-elevated);
  box-shadow: var(--shadow-elevated);
}

.field-card h2 {
  margin: 10px 0 4px;
  color: var(--color-text-main);
  font-size: 18px;
}

.field-card p {
  margin: 0;
  color: var(--color-text-muted);
}

.type-pill,
.required-badge {
  width: fit-content;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
}

.type-pill {
  background: #eef2ff;
  color: #4338ca;
}

.required-badge {
  background: #dcfce7;
  color: #166534;
}

.required-badge--off {
  background: #e5e7eb;
  color: #475569;
}

.field-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn--small {
  justify-content: center;
  padding: 8px 10px;
  font-size: 12px;
}

.empty-card {
  padding: 40px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  background: var(--color-bg-surface-elevated);
  text-align: center;
  box-shadow: var(--shadow-elevated);
}

.empty-card h2 {
  color: var(--color-text-main);
}

.empty-card p,
.modal-subtitle {
  color: var(--color-text-muted);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(8px);
}

.modal-card {
  width: min(760px, 100%);
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96));
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.3);
}

.modal-card--danger {
  width: min(620px, 100%);
  border-color: rgba(239, 68, 68, 0.25);
}

.modal-title {
  margin: 0 0 6px;
  color: var(--color-text-main);
}

.modal-close {
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: white;
  color: var(--color-text-main);
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.field {
  display: grid;
  gap: 8px;
  color: var(--color-text-main);
  font-weight: 800;
}

.field input,
.field select {
  min-height: 48px;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: white;
  color: var(--color-text-main);
  font: inherit;
}

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-main);
  font-weight: 800;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 22px;
}

@media (max-width: 768px) {
  .field-stats,
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .header-row .btn,
  .modal-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-backdrop {
    align-items: end;
    padding: 12px;
  }

  .modal-card {
    max-height: 92vh;
    overflow: auto;
    border-radius: 24px 24px 0 0;
  }
}
</style>
