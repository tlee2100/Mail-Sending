<template>
  <section class="content__header header-with-action">
    <div>
      <p class="eyebrow">Template Library</p>
      <h1 class="page-title">Saved Email Templates</h1>
      <p class="page-subtitle">Create, edit, delete and open templates in Designer.</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="openCreateModal">
      + Create in Designer
    </button>
  </section>

  <section class="content__section quick-links">
    <RouterLink :to="designerTarget" class="btn btn--secondary">Open Designer</RouterLink>
    <RouterLink :to="versionsTarget" class="btn btn--secondary">Open Versions</RouterLink>
  </section>

  <section class="grid grid--stats-three">
    <div class="card card--stat-tpl card--blue">
      <span class="card__icon">Tpl</span>
      <span class="card__value">{{ templates.length }}</span>
      <span class="card__label">Total Templates</span>
    </div>
    <div class="card card--stat-tpl card--green">
      <span class="card__icon">Act</span>
      <span class="card__value">{{ activeCount }}</span>
      <span class="card__label">Active Templates</span>
    </div>
    <div class="card card--stat-tpl card--cyan">
      <span class="card__icon">New</span>
      <span class="card__value">{{ latestTemplateName }}</span>
      <span class="card__label">Latest Template</span>
    </div>
  </section>

  <section class="content__section">
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">Find</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="search-input"
        />
      </div>
    </div>

    <div class="grid grid--samples" v-if="filteredTemplates.length">
      <article v-for="item in filteredTemplates" :key="item.id" class="card sample-card">
        <div class="sample-card__top">
          <h3 class="sample-card__title">{{ item.template_name }}</h3>
          <span class="sample-card__badge" :class="{ 'sample-card__badge--off': !item.is_active }">
            {{ item.is_active ? "Active" : "Inactive" }}
          </span>
        </div>
        <p v-if="ownerText(item)" class="sample-card__owner">{{ ownerText(item) }}</p>
        <p class="sample-card__subject">{{ item.subject || "No subject" }}</p>
        <p class="sample-card__desc">{{ item.preview_text || "No preview text" }}</p>
        <div class="sample-card__actions">
          <RouterLink :to="`/templates/${item.id}/designer`" class="btn btn--secondary btn--small">
            Designer
          </RouterLink>
          <button
            type="button"
            class="btn btn--secondary btn--small"
            :disabled="!canManage(item)"
            :title="manageBlockedTitle(item)"
            @click="openEditModal(item)"
          >
            Edit
          </button>
          <button
            type="button"
            class="btn btn--danger btn--small"
            :disabled="!canDelete(item)"
            :title="deleteBlockedTitle(item)"
            @click="openDeleteModal(item)"
          >
            Delete
          </button>
        </div>
      </article>
    </div>
    <div v-else class="card empty-card">
      <h3>No templates found.</h3>
      <p>Create a template, then open it in Designer for drag-and-drop editing.</p>
      <button type="button" class="btn btn--primary" @click="openCreateModal">
        Create in Designer
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <form class="modal-card" @submit.prevent="submitTemplate">
        <header class="modal-head">
          <div>
            <p class="eyebrow">{{ editingTemplate ? "Edit template" : "New template" }}</p>
            <h2 class="modal-title">{{ editingTemplate ? "Update template details" : "Create template for Designer" }}</h2>
            <p class="modal-subtitle">Set the template details, then continue designing it in Template Designer.</p>
          </div>
          <button type="button" class="modal-close" @click="closeModal">x</button>
        </header>

        <div class="form-grid">
          <label class="field field--wide">
            <span>Template name *</span>
            <input v-model.trim="form.templateName" type="text" required placeholder="Launch Announcement" />
          </label>
          <label class="field">
            <span>Subject</span>
            <input v-model.trim="form.subject" type="text" placeholder="New update for you" />
          </label>
          <label class="field">
            <span>Preview text</span>
            <input v-model.trim="form.previewText" type="text" placeholder="Short inbox preview" />
          </label>
          <label class="check-row field--wide">
            <input v-model="form.isActive" type="checkbox" />
            <span>Active template</span>
          </label>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn--primary" :disabled="saving">
            {{ saving ? "Saving..." : editingTemplate ? "Save changes" : "Create and design" }}
          </button>
        </footer>
      </form>
    </div>

    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <section class="modal-card modal-card--danger">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Delete template</p>
            <h2 class="modal-title">Delete {{ deleteTarget.template_name }}?</h2>
            <p class="modal-subtitle">Campaigns using this template may lose their source template reference.</p>
          </div>
          <button type="button" class="modal-close" @click="deleteTarget = null">x</button>
        </header>
        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="deleteTarget = null">Cancel</button>
          <button type="button" class="btn btn--danger" :disabled="saving" @click="deleteTemplate">
            Delete template
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { adminApi } from "../api/adminApi";
import { templatesApi } from "../api/templatesApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  canDeleteTemplate,
  canManageTemplate,
  hasTemplateOwner,
  isAdminUser,
  isTemplateOwnedByUser,
  templateOwnerLabel,
} from "../utils/templateOwnership";

type TemplateRow = {
  id: number;
  template_name: string;
  subject?: string | null;
  preview_text?: string | null;
  content_html?: string | null;
  content_text?: string | null;
  is_active: boolean;
  [key: string]: unknown;
};

const notice = useNotice();
const router = useRouter();
const templates = ref<TemplateRow[]>([]);
const searchQuery = ref("");
const isModalOpen = ref(false);
const saving = ref(false);
const editingTemplate = ref<TemplateRow | null>(null);
const deleteTarget = ref<TemplateRow | null>(null);
const form = reactive({
  templateName: "",
  subject: "",
  previewText: "",
  contentHtml: "",
  contentText: "",
  isActive: true,
});

const filteredTemplates = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return templates.value.filter((item) => {
    return (
      !query ||
      item.template_name.toLowerCase().includes(query) ||
      String(item.subject || "").toLowerCase().includes(query) ||
      String(item.preview_text || "").toLowerCase().includes(query)
    );
  });
});

const activeCount = computed(() => templates.value.filter((item) => item.is_active).length);
const latestTemplateName = computed(() => templates.value[0]?.template_name || "None");
const designerTarget = computed(() => "/templates/designer");
const versionsTarget = computed(() => {
  const current = templates.value[0];
  return current ? `/templates/${current.id}/designer/versions` : "/templates/designer";
});

function resetForm() {
  form.templateName = "";
  form.subject = "";
  form.previewText = "";
  form.contentHtml = "";
  form.contentText = "";
  form.isActive = true;
}

function canManage(item: TemplateRow | null) {
  return canManageTemplate(item, auth.state.user);
}

function canDelete(item: TemplateRow | null) {
  return canDeleteTemplate(item, auth.state.user);
}

function ownerText(item: TemplateRow) {
  if (!hasTemplateOwner(item)) return "";
  if (isTemplateOwnedByUser(item, auth.state.user)) return "Owned by you";
  const owner = templateOwnerLabel(item);
  return owner ? `Shared by ${owner}` : "Shared template";
}

function manageBlockedTitle(item: TemplateRow) {
  return canManage(item)
    ? ""
    : "Only the owner can edit this template. Open Designer to save changes as your own copy.";
}

function deleteBlockedTitle(item: TemplateRow) {
  return canDelete(item) ? "" : "Only the owner or an admin can delete this template.";
}

async function loadTemplates() {
  if (!auth.state.token) return;
  try {
    const response = await templatesApi.listTemplates(auth.state.token, { pageSize: 100 });
    templates.value = response.data.items as TemplateRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load templates";
    notice.show(message, "error");
  }
}

function openCreateModal() {
  editingTemplate.value = null;
  resetForm();
  isModalOpen.value = true;
}

async function openEditModal(item: TemplateRow) {
  if (!auth.state.token) return;
  if (!canManage(item)) {
    notice.show(
      "Only the owner can edit this template. Open Designer to save changes as your own copy.",
      "error",
    );
    return;
  }
  try {
    const response = await templatesApi.getTemplate(auth.state.token, item.id);
    const detail = response.data as TemplateRow;
    editingTemplate.value = detail;
    form.templateName = detail.template_name || "";
    form.subject = detail.subject || "";
    form.previewText = detail.preview_text || "";
    form.contentHtml = detail.content_html || "";
    form.contentText = detail.content_text || "";
    form.isActive = detail.is_active !== false;
    isModalOpen.value = true;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load template";
    notice.show(message, "error");
  }
}

function closeModal() {
  isModalOpen.value = false;
}

function extractTemplateId(template: Record<string, unknown>) {
  const nestedTemplate =
    template.template && typeof template.template === "object"
      ? (template.template as Record<string, unknown>)
      : null;
  const nestedItem =
    template.item && typeof template.item === "object"
      ? (template.item as Record<string, unknown>)
      : null;
  const nestedRecord =
    template.record && typeof template.record === "object"
      ? (template.record as Record<string, unknown>)
      : null;
  const source = nestedTemplate || nestedItem || nestedRecord || template;
  const id = source.id ?? source.template_id ?? source.templateId;
  return id === undefined || id === null ? "" : String(id);
}

function findCreatedTemplateId(templateName: string) {
  const normalizedName = templateName.trim().toLowerCase();
  const match = templates.value.find(
    (template) => template.template_name.trim().toLowerCase() === normalizedName,
  );
  return match ? extractTemplateId(match) : "";
}

function openDeleteModal(item: TemplateRow) {
  if (!canDelete(item)) {
    notice.show("Only the owner or an admin can delete this template.", "error");
    return;
  }
  deleteTarget.value = item;
}

async function submitTemplate() {
  if (!auth.state.token || saving.value) return;
  saving.value = true;
  try {
    const defaultText = `Hello {{name}},`;
    const body = {
      templateName: form.templateName,
      subject: form.subject || undefined,
      previewText: form.previewText || undefined,
      contentHtml: editingTemplate.value ? undefined : `<p>${defaultText}</p>`,
      contentText: editingTemplate.value ? undefined : defaultText,
      isActive: form.isActive,
    };

    if (editingTemplate.value && canManage(editingTemplate.value)) {
      await templatesApi.updateTemplate(auth.state.token, editingTemplate.value.id, body);
      notice.show("Template updated.", "success");
      closeModal();
      await loadTemplates();
    } else {
      const response = await templatesApi.createTemplate(auth.state.token, body);
      let templateId = extractTemplateId(response.data);
      closeModal();
      await loadTemplates();
      if (!templateId) {
        templateId = findCreatedTemplateId(form.templateName);
      }
      if (templateId) {
        notice.show("Template created. Opening Designer.", "success");
        await router.push({ name: "template-designer", params: { id: templateId } });
      } else {
        notice.show("Template created, but the API did not return its ID.", "success");
      }
    }
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to save template";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate() {
  if (!auth.state.token || !deleteTarget.value || saving.value) return;
  if (!canDelete(deleteTarget.value)) {
    notice.show("Only the owner or an admin can delete this template.", "error");
    deleteTarget.value = null;
    return;
  }
  saving.value = true;
  try {
    if (
      isAdminUser(auth.state.user) &&
      !isTemplateOwnedByUser(deleteTarget.value, auth.state.user)
    ) {
      await adminApi.deleteTemplate(auth.state.token, deleteTarget.value.id);
    } else {
      await templatesApi.deleteTemplate(auth.state.token, deleteTarget.value.id);
    }
    notice.show("Template deleted.", "success");
    deleteTarget.value = null;
    await loadTemplates();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to delete template";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadTemplates();
});
</script>

<style scoped>
.header-with-action,
.modal-head,
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.grid--stats-three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 24px;
}

.card--stat-tpl {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-white);
  padding: 20px;
  border: none;
}

.card--blue { background: linear-gradient(135deg, var(--color-info), var(--color-info-light)); }
.card--green { background: linear-gradient(135deg, var(--color-success-teal), var(--color-success-cyan)); color: var(--color-cyan-text-on-solid); }
.card--cyan { background: linear-gradient(135deg, var(--color-cyan), var(--color-cyan-soft)); color: var(--color-cyan-text-on-solid); }

.card--stat-tpl .card__icon { font-size: 18px; font-weight: 700; }
.card--stat-tpl .card__value { font-size: 28px; font-weight: 800; }
.card--stat-tpl .card__label { font-size: 13px; opacity: 0.95; color: inherit; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.search-wrap { flex: 1; position: relative; }
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  font-size: 12px; font-weight: 700; opacity: 0.6;
}
.search-input {
  width: 100%; padding: 10px 12px 10px 48px; border-radius: 10px;
  border: 1px solid var(--color-border-subtle); font-size: 14px; box-sizing: border-box;
  background: var(--color-control-bg); color: var(--color-text-main);
}

.grid--samples { grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); }
.sample-card {
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-main);
  box-shadow: var(--shadow-elevated);
}
.sample-card__top {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;
}
.sample-card__title { margin: 0; font-size: 16px; font-weight: 800; }
.sample-card__badge {
  border-radius: 999px;
  background: var(--color-success-bg);
  color: var(--color-success-text-strong);
  font-size: 11px;
  font-weight: 800;
  padding: 5px 9px;
}
.sample-card__badge--off {
  background: var(--color-border-subtle);
  color: var(--color-text-subtle);
}
.sample-card__subject { margin: 0 0 8px; font-weight: 700; }
.sample-card__owner {
  margin: 0 0 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}
.sample-card__desc { margin: 0 0 16px; font-size: 13px; color: var(--color-text-muted); }
.sample-card__actions {
  display: grid;
  grid-template-columns: 1fr 0.7fr 0.7fr;
  gap: 8px;
}
.btn--small { justify-content: center; padding: 8px 10px; font-size: 12px; text-decoration: none; }
.btn--small:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.quick-links { display: flex; gap: 10px; flex-wrap: wrap; }

.empty-card {
  padding: 36px;
  text-align: center;
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
  background: var(--color-overlay);
  backdrop-filter: blur(8px);
}

.modal-card {
  width: min(920px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 26px;
  border: 1px solid var(--color-modal-border);
  border-radius: 26px;
  background: linear-gradient(135deg, var(--color-surface-glass), var(--color-surface-glass-muted));
  box-shadow: 0 28px 80px var(--shadow-modal-color);
}

.modal-card--danger {
  width: min(620px, 100%);
  border-color: var(--color-border-danger-muted);
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
  background: var(--color-white);
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

.field--wide,
.check-row {
  grid-column: 1 / -1;
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-white);
  color: var(--color-text-main);
  font: inherit;
}

.field input {
  min-height: 48px;
  padding: 0 14px;
}

.field textarea {
  padding: 14px;
  resize: vertical;
}

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 22px;
}

@media (max-width: 768px) {
  .grid--stats-three,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .field--wide,
  .check-row {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .header-with-action .btn,
  .sample-card__actions,
  .modal-actions .btn {
    width: 100%;
  }

  .sample-card__actions {
    grid-template-columns: 1fr;
  }

  .modal-backdrop {
    align-items: end;
    padding: 12px;
  }

  .modal-card {
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
  }
}
</style>
