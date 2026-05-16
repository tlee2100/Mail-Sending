<template>
  <section class="content__header header-with-action">
    <div>
      <p class="eyebrow">Audience labels</p>
      <h1 class="page-title">Contact Tags</h1>
      <p class="page-subtitle">Create, edit and organize contact audience tags.</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="openCreateModal">
      + Create Tag
    </button>
  </section>

  <section class="content__section">
    <div class="grid grid--tags" v-if="tags.length">
      <article v-for="tag in tags" :key="tag.id" class="card card--tag">
        <div class="tag-card-head">
          <div class="tag-badge" :style="{ background: `${tag.color}20`, color: tag.color }">
            {{ tag.tag_name }}
          </div>
          <span class="tag-dot" :style="{ background: tag.color }"></span>
        </div>
        <h3 class="tag-title">{{ tag.tag_name }}</h3>
        <p class="tag-count">{{ tag.contact_count || 0 }}</p>
        <p class="tag-desc">Contacts in this audience segment</p>
        <div class="tag-meta">
          <span>Created {{ formatDate(tag.created_at) }}</span>
        </div>
        <div class="tag-actions">
          <RouterLink
            class="btn btn--secondary btn--small"
            :to="{ name: 'email-contacts', query: { tagId: tag.id } }"
          >
            View Contacts
          </RouterLink>
          <button type="button" class="btn btn--secondary btn--small" @click="openEditModal(tag)">
            Edit
          </button>
          <button type="button" class="btn btn--danger btn--small" @click="openDeleteModal(tag)">
            Delete
          </button>
        </div>
      </article>
    </div>
    <div class="card card--cta" v-else>
      <h3 class="cta-title">No tags found</h3>
      <p class="cta-desc">Create your first backend tag to organize contacts.</p>
      <button type="button" class="btn btn--primary btn--lg" @click="openCreateModal">
        + Create Tag
      </button>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="isFormOpen" class="modal-backdrop" @click.self="closeForm">
      <form class="modal-card" @submit.prevent="submitTag">
        <header class="modal-head">
          <div>
            <p class="eyebrow">{{ editingTag ? "Edit tag" : "New tag" }}</p>
            <h2 class="modal-title">{{ editingTag ? "Update contact tag" : "Create contact tag" }}</h2>
            <p class="modal-subtitle">Use tags to segment contacts before sending campaigns.</p>
          </div>
          <button type="button" class="modal-close" @click="closeForm">x</button>
        </header>

        <div class="form-grid">
          <label class="field">
            <span>Tag name *</span>
            <input v-model.trim="form.tagName" type="text" placeholder="VIP" required />
          </label>
          <label class="field">
            <span>Color *</span>
            <input v-model="form.color" type="color" required />
          </label>
        </div>

        <div class="preview-strip">
          <span class="tag-badge" :style="{ background: `${form.color}20`, color: form.color }">
            {{ form.tagName || "Preview tag" }}
          </span>
        </div>

        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="closeForm">Cancel</button>
          <button type="submit" class="btn btn--primary" :disabled="saving">
            {{ saving ? "Saving..." : editingTag ? "Save changes" : "Create tag" }}
          </button>
        </footer>
      </form>
    </div>

    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <section class="modal-card modal-card--danger">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Delete tag</p>
            <h2 class="modal-title">Delete {{ deleteTarget.tag_name }}?</h2>
            <p class="modal-subtitle">This removes the tag mapping from contacts. Contacts will not be deleted.</p>
          </div>
          <button type="button" class="modal-close" @click="deleteTarget = null">x</button>
        </header>
        <footer class="modal-actions">
          <button type="button" class="btn btn--secondary" @click="deleteTarget = null">Cancel</button>
          <button type="button" class="btn btn--danger" :disabled="saving" @click="deleteTag">
            Delete tag
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type TagRow = {
  id: number;
  tag_name: string;
  color: string;
  created_at: string;
  contact_count?: number;
};

const notice = useNotice();
const tags = ref<TagRow[]>([]);
const isFormOpen = ref(false);
const saving = ref(false);
const editingTag = ref<TagRow | null>(null);
const deleteTarget = ref<TagRow | null>(null);
const form = reactive({
  tagName: "",
  color: "#4f46e5",
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function resetForm() {
  form.tagName = "";
  form.color = "#4f46e5";
}

async function loadTags() {
  if (!auth.state.token) return;
  try {
    const response = await contactsApi.listTags(auth.state.token);
    tags.value = response.data as TagRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load tags";
    notice.show(message, "error");
  }
}

function openCreateModal() {
  editingTag.value = null;
  resetForm();
  isFormOpen.value = true;
}

function openEditModal(tag: TagRow) {
  editingTag.value = tag;
  form.tagName = tag.tag_name;
  form.color = tag.color || "#4f46e5";
  isFormOpen.value = true;
}

function closeForm() {
  isFormOpen.value = false;
}

function openDeleteModal(tag: TagRow) {
  deleteTarget.value = tag;
}

async function submitTag() {
  if (!auth.state.token || saving.value) return;
  saving.value = true;
  try {
    if (editingTag.value) {
      await contactsApi.updateTag(auth.state.token, editingTag.value.id, {
        tagName: form.tagName,
        color: form.color,
      });
      notice.show("Tag updated.", "success");
    } else {
      await contactsApi.createTag(auth.state.token, {
        tagName: form.tagName,
        color: form.color,
      });
      notice.show("Tag created.", "success");
    }
    closeForm();
    await loadTags();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to save tag";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

async function deleteTag() {
  if (!auth.state.token || !deleteTarget.value || saving.value) return;
  saving.value = true;
  try {
    await contactsApi.deleteTag(auth.state.token, deleteTarget.value.id);
    notice.show("Tag deleted.", "success");
    deleteTarget.value = null;
    await loadTags();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to delete tag";
    notice.show(message, "error");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadTags();
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

.grid--tags {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.card--tag {
  position: relative;
  padding: 22px;
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-elevated);
}

.tag-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.tag-badge {
  display: inline-flex;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.tag-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
}

.tag-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-main);
}

.tag-count {
  margin: 12px 0 2px;
  color: var(--color-text-main);
  font-size: 38px;
  line-height: 1;
  font-weight: 900;
}

.tag-desc,
.tag-meta,
.cta-desc,
.modal-subtitle {
  color: var(--color-text-muted);
}

.tag-desc {
  margin: 0 0 10px;
  font-size: 13px;
}

.tag-meta {
  margin-bottom: 16px;
  font-size: 12px;
}

.tag-actions {
  display: grid;
  grid-template-columns: 1fr 0.7fr 0.7fr;
  gap: 8px;
}

.btn--small {
  justify-content: center;
  padding: 8px 10px;
  font-size: 12px;
  text-decoration: none;
}

.card--cta {
  padding: 36px;
  text-align: center;
}

.cta-title {
  margin: 0 0 12px;
  color: var(--color-text-main);
  font-size: 18px;
  font-weight: 800;
}

.cta-desc {
  margin: 0 0 20px;
}

.btn--lg {
  padding: 12px 24px;
  font-size: 15px;
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
  width: min(640px, 100%);
  padding: 26px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96));
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.3);
}

.modal-card--danger {
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
  grid-template-columns: 1fr 120px;
  gap: 16px;
  margin-top: 22px;
}

.field {
  display: grid;
  gap: 8px;
  color: var(--color-text-main);
  font-weight: 800;
}

.field input {
  min-height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: white;
  color: var(--color-text-main);
  font: inherit;
}

.field input[type="text"] {
  padding: 0 14px;
}

.field input[type="color"] {
  padding: 5px;
}

.preview-strip {
  margin-top: 18px;
  padding: 16px;
  border: 1px dashed var(--color-border-subtle);
  border-radius: 18px;
  background: white;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 22px;
}

@media (max-width: 640px) {
  .header-with-action .btn,
  .tag-actions,
  .form-grid,
  .modal-actions .btn {
    width: 100%;
  }

  .tag-actions,
  .form-grid {
    grid-template-columns: 1fr;
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
