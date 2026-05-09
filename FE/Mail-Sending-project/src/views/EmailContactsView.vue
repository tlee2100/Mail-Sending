<template>
  <section class="content__header header-with-actions">
    <div>
      <h1 class="page-title">Email Contacts</h1>
      <p class="page-subtitle">Live contact list from backend</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <div class="header-buttons">
      <RouterLink to="/contacts/import-export" class="btn btn--secondary">
        Import / Export
      </RouterLink>
      <RouterLink to="/contacts/fields" class="btn btn--secondary">
        Fields
      </RouterLink>
      <button type="button" class="btn btn--primary" @click="addContact">
        + Add Contact
      </button>
    </div>
  </section>

  <section class="content__section">
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">Find</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search contacts..."
          class="search-input"
        />
      </div>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select v-model="filterTagId" class="filter-select">
        <option value="">All Tags</option>
        <option v-for="tag in tags" :key="tag.id" :value="String(tag.id)">
          {{ tag.tag_name }} ({{ tag.contact_count || 0 }})
        </option>
      </select>
      <input
        v-model="filterCity"
        type="text"
        placeholder="City"
        class="filter-input"
      />
      <button type="button" class="btn btn--primary" @click="loadContacts">
        Filter
      </button>
      <button type="button" class="btn btn--secondary" @click="clearFilters">
        Clear
      </button>
    </div>

    <div class="card card--table" v-if="contacts.length">
      <div class="card__header">
        <h3 class="card__title">Contacts ({{ pagination.total }})</h3>
        <button type="button" class="btn btn--secondary btn--sm" @click="loadContacts">
          Refresh
        </button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Tags</th>
            <th>Company</th>
            <th>City</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in contacts" :key="contact.id">
            <td>{{ fullName(contact) }}</td>
            <td data-label="Email">{{ contact.email }}</td>
            <td data-label="Status">{{ contact.email_status || "active" }}</td>
            <td data-label="Tags">
              <div class="tag-stack" v-if="contact.tags?.length">
                <span
                  v-for="tag in contact.tags"
                  :key="tag.id"
                  class="contact-tag"
                  :style="{ backgroundColor: `${tag.color}20`, color: tag.color }"
                >
                  {{ tag.tag_name }}
                </span>
              </div>
              <span v-else class="muted">No tags</span>
            </td>
            <td data-label="Company">{{ contact.company || "-" }}</td>
            <td data-label="City">{{ contact.city || "-" }}</td>
            <td>
              <button
                type="button"
                class="btn btn--secondary btn--sm"
                @click="openTagManager(contact)"
              >
                Tags
              </button>
              <RouterLink :to="`/contacts/${contact.id}/fields`" class="btn btn--secondary btn--sm">
                Fields
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card card--table" v-else>
      <div class="empty-state-inline">
        <div class="empty-icon">List</div>
        <h4 class="empty-title">No Contacts Found</h4>
        <p class="empty-desc">Create a contact or adjust filters.</p>
      </div>
    </div>
  </section>

  <div v-if="tagDialogContact" class="modal-backdrop" @click.self="closeTagManager">
    <section class="modal-card">
      <header class="modal-head">
        <div>
          <h2 class="modal-title">Manage Tags</h2>
          <p class="modal-subtitle">{{ fullName(tagDialogContact) }}</p>
        </div>
        <button type="button" class="modal-close" @click="closeTagManager">x</button>
      </header>

      <div class="tag-picker" v-if="tags.length">
        <label
          v-for="tag in tags"
          :key="tag.id"
          class="tag-option"
          :style="{ borderColor: `${tag.color}55` }"
        >
          <input
            v-model="selectedTagIds"
            type="checkbox"
            :value="tag.id"
          />
          <span
            class="contact-tag"
            :style="{ backgroundColor: `${tag.color}20`, color: tag.color }"
          >
            {{ tag.tag_name }}
          </span>
          <span class="tag-option__count">{{ tag.contact_count || 0 }} contacts</span>
        </label>
      </div>
      <p v-else class="empty-desc">Create tags first before assigning contacts.</p>

      <footer class="modal-actions">
        <button type="button" class="btn btn--secondary" @click="closeTagManager">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="isSavingTags"
          @click="saveContactTags"
        >
          {{ isSavingTags ? "Saving..." : "Save Tags" }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type ContactRow = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  city?: string | null;
  email_status?: string | null;
  tags?: TagRow[];
};

type TagRow = {
  id: number;
  tag_name: string;
  color: string;
  created_at?: string;
  contact_count?: number;
};

const notice = useNotice();
const route = useRoute();
const contacts = ref<ContactRow[]>([]);
const tags = ref<TagRow[]>([]);
const searchQuery = ref("");
const filterStatus = ref("");
const filterCity = ref("");
const filterTagId = ref(String(route.query.tagId || ""));
const tagDialogContact = ref<ContactRow | null>(null);
const selectedTagIds = ref<number[]>([]);
const isSavingTags = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
});

function fullName(contact: ContactRow) {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  return name || contact.email;
}

async function loadContacts() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  try {
    const response = await contactsApi.listContacts(auth.state.token, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
      city: filterCity.value || undefined,
      tagId: filterTagId.value ? Number(filterTagId.value) : undefined,
    });

    contacts.value = response.data.items as ContactRow[];
    Object.assign(pagination, response.data.pagination);
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load contacts";
    notice.show(message, "error");
  }
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

async function addContact() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  const email = window.prompt("Contact email", "");
  if (!email?.trim()) return;
  const firstName = window.prompt("First name", "") || undefined;
  const lastName = window.prompt("Last name", "") || undefined;
  const city = window.prompt("City", "") || undefined;

  try {
    await contactsApi.createContact(auth.state.token, {
      email: email.trim(),
      firstName,
      lastName,
      city,
      emailStatus: "active",
      source: "manual",
    });
    notice.show("Contact created.", "success");
    await loadContacts();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to create contact";
    notice.show(message, "error");
  }
}

function clearFilters() {
  searchQuery.value = "";
  filterStatus.value = "";
  filterCity.value = "";
  filterTagId.value = "";
  void loadContacts();
}

function openTagManager(contact: ContactRow) {
  tagDialogContact.value = contact;
  selectedTagIds.value = (contact.tags || []).map((tag) => tag.id);
}

function closeTagManager() {
  tagDialogContact.value = null;
  selectedTagIds.value = [];
}

async function saveContactTags() {
  if (!auth.state.token || !tagDialogContact.value) return;

  isSavingTags.value = true;
  try {
    await contactsApi.replaceContactTags(
      auth.state.token,
      tagDialogContact.value.id,
      selectedTagIds.value,
    );
    notice.show("Contact tags updated.", "success");
    closeTagManager();
    await Promise.all([loadContacts(), loadTags()]);
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to update tags";
    notice.show(message, "error");
  } finally {
    isSavingTags.value = false;
  }
}

onMounted(() => {
  void Promise.all([loadTags(), loadContacts()]);
});
</script>

<style scoped>
.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.header-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: var(--color-control-bg-muted);
  border-radius: 12px;
}

.search-wrap {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 48px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  box-sizing: border-box;
  background: var(--color-control-bg);
  color: var(--color-text-main);
}

.filter-select,
.filter-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  background: var(--color-control-bg);
  min-width: 120px;
}

.card--table {
  padding: 24px;
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.btn--sm {
  padding: 8px 14px;
  font-size: 13px;
  margin-right: 8px;
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
}

.tag-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.contact-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.muted {
  color: #94a3b8;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
}

.modal-card {
  width: min(560px, 100%);
  border-radius: 12px;
  background: var(--color-bg-surface-elevated);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
  padding: 22px;
}

.modal-head,
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
}

.modal-subtitle {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.modal-close {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-control-bg);
  cursor: pointer;
}

.tag-picker {
  display: grid;
  gap: 10px;
  margin: 18px 0;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: #ffffff;
}

.tag-option__count {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 12px;
}

.modal-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.empty-state-inline {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 22px;
  font-weight: 700;
  opacity: 0.35;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #374151;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .header-with-actions {
    align-items: stretch;
  }

  .header-buttons {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .header-buttons .btn {
    justify-content: center;
  }

  .filter-bar {
    padding: 12px;
    border-radius: 12px;
  }

  .search-wrap,
  .filter-select,
  .filter-input,
  .filter-bar .btn {
    width: 100%;
    min-width: 0;
  }

  .card--table {
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  .card__header {
    margin-bottom: 12px;
  }

  .table,
  .table thead,
  .table tbody,
  .table tr,
  .table td {
    display: block;
    width: 100%;
  }

  .table thead {
    display: none;
  }

  .table tr {
    box-sizing: border-box;
    padding: 14px;
    margin-bottom: 12px;
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    background: var(--color-bg-surface-elevated);
    box-shadow: var(--shadow-elevated);
  }

  .table td {
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border-subtle);
    overflow-wrap: anywhere;
  }

  .table td::before {
    content: attr(data-label);
    flex-shrink: 0;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .table td:first-child {
    display: block;
    font-size: 15px;
    font-weight: 700;
  }

  .table td:first-child::before {
    display: none;
  }

  .table td:last-child {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    border-bottom: none;
  }

  .table td:last-child::before {
    display: none;
  }

  .btn--sm {
    margin-right: 0;
    justify-content: center;
  }

  .modal-backdrop {
    align-items: flex-end;
    padding: 12px;
  }

  .modal-card {
    max-height: 88vh;
    overflow: auto;
    border-radius: 16px 16px 12px 12px;
  }
}
</style>
