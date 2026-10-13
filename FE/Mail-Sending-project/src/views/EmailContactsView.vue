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
      <RouterLink v-if="isAdmin" to="/contacts/fields" class="btn btn--secondary">
        Fields
      </RouterLink>
      <button type="button" class="btn btn--primary" @click="openCreateContactModal">
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
      <input v-model="filterCity" type="text" placeholder="City" class="filter-input" />
      <button type="button" class="btn btn--primary" @click="loadContacts">Filter</button>
      <button type="button" class="btn btn--secondary" @click="clearFilters">Clear</button>
    </div>

    <TableSkeleton v-if="isLoading" :rows="6" :columns="6" />

    <ContactTable
      v-else-if="contacts.length"
      :contacts="contacts"
      :is-admin="isAdmin"
      :pagination="pagination"
      :full-name="fullName"
      :owner-text="ownerText"
      :can-manage-contact="canManageContact"
      :manage-blocked-title="manageBlockedTitle"
      @refresh="loadContacts"
      @edit="openEditContactModal"
      @manage-tags="openTagManager"
      @delete="openDeleteContactModal"
      @page-change="handlePageChange"
    />

    <EmptyState
      v-else
      title="No Contacts Found"
      description="No contacts match your current filters. Add a new contact to get started."
    >
      <template #actions>
        <button type="button" class="btn btn--primary" @click="openCreateContactModal">
          + Add Contact
        </button>
      </template>
    </EmptyState>
  </section>

  <ContactFormModal
    :is-open="contactDialogOpen"
    :contact="editingContact"
    :is-saving="isSavingContact"
    @close="closeContactDialog"
    @save="saveContactWithPayload"
  />

  <div v-if="deleteContactTarget" class="modal-backdrop" @click.self="deleteContactTarget = null">
    <section class="modal-card">
      <header class="modal-head">
        <div>
          <p class="modal-kicker">Delete contact</p>
          <h2 class="modal-title">Delete {{ fullName(deleteContactTarget) }}?</h2>
          <p class="modal-subtitle">This contact will be removed from lists and tag mappings.</p>
        </div>
        <button type="button" class="modal-close" @click="deleteContactTarget = null">x</button>
      </header>
      <footer class="modal-actions">
        <button type="button" class="btn btn--secondary" @click="deleteContactTarget = null">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn--danger"
          :disabled="isSavingContact"
          @click="deleteContact"
        >
          Delete contact
        </button>
      </footer>
    </section>
  </div>

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
          <input v-model="selectedTagIds" type="checkbox" :value="tag.id" />
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
        <button type="button" class="btn btn--secondary" @click="closeTagManager">Cancel</button>
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
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import TableSkeleton from "../components/common/TableSkeleton.vue";
import EmptyState from "../components/common/EmptyState.vue";
import ContactTable from "../components/contacts/ContactTable.vue";
import ContactFormModal from "../components/contacts/ContactFormModal.vue";
import { canManageOwnRecord, recordOwnerLabel } from "../utils/recordOwnership";

type ContactRow = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  country?: string | null;
  email_status?: string | null;
  source?: string | null;
  tags?: TagRow[];
  [key: string]: unknown;
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
const isLoading = ref(true);
const contacts = ref<ContactRow[]>([]);
const tags = ref<TagRow[]>([]);
const searchQuery = ref("");
const filterStatus = ref("");
const filterCity = ref("");
const filterTagId = ref(String(route.query.tagId || ""));
const tagDialogContact = ref<ContactRow | null>(null);
const selectedTagIds = ref<number[]>([]);
const isSavingTags = ref(false);
const contactDialogOpen = ref(false);
const editingContact = ref<ContactRow | null>(null);
const deleteContactTarget = ref<ContactRow | null>(null);
const isSavingContact = ref(false);
const contactForm = reactive({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  city: "",
  country: "",
  emailStatus: "active",
  source: "manual",
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
});
const isAdmin = computed(() => auth.state.user?.role === "admin");

function canManageContact(contact: ContactRow | null) {
  return canManageOwnRecord(contact, auth.state.user);
}

function ownerText(contact: ContactRow) {
  return recordOwnerLabel(contact);
}

function manageBlockedTitle(contact: ContactRow) {
  return canManageContact(contact)
    ? ""
    : "Admin can view this contact here, but should not edit another user's contact in the normal route.";
}

function fullName(contact: ContactRow) {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  return name || contact.email;
}

function handlePageChange(newPage: number) {
  pagination.page = newPage;
  void loadContacts();
}

async function loadContacts() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  isLoading.value = true;
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
    const message = error instanceof ApiClientError ? error.message : "Failed to load contacts";
    notice.show(message, "error");
  } finally {
    isLoading.value = false;
  }
}

async function loadTags() {
  if (!auth.state.token) return;
  try {
    const response = await contactsApi.listTags(auth.state.token);
    tags.value = response.data as TagRow[];
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to load tags";
    notice.show(message, "error");
  }
}

function resetContactForm() {
  contactForm.email = "";
  contactForm.firstName = "";
  contactForm.lastName = "";
  contactForm.phone = "";
  contactForm.company = "";
  contactForm.city = "";
  contactForm.country = "";
  contactForm.emailStatus = "active";
  contactForm.source = "manual";
}

function openCreateContactModal() {
  editingContact.value = null;
  resetContactForm();
  contactDialogOpen.value = true;
}

function openEditContactModal(contact: ContactRow) {
  if (!canManageContact(contact)) {
    notice.show(
      "Admin should not edit another user's contact from the normal contacts route.",
      "error",
    );
    return;
  }
  editingContact.value = contact;
  contactForm.email = contact.email || "";
  contactForm.firstName = contact.first_name || "";
  contactForm.lastName = contact.last_name || "";
  contactForm.phone = contact.phone || "";
  contactForm.company = contact.company || "";
  contactForm.city = contact.city || "";
  contactForm.country = contact.country || "";
  contactForm.emailStatus = contact.email_status || "active";
  contactForm.source = contact.source || "manual";
  contactDialogOpen.value = true;
}

function closeContactDialog() {
  contactDialogOpen.value = false;
}

async function saveContactWithPayload(payload: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  city?: string;
  country?: string;
  emailStatus?: string;
  source?: string;
}) {
  if (!auth.state.token || isSavingContact.value) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  isSavingContact.value = true;
  try {
    const data = {
      email: payload.email,
      firstName: payload.firstName || undefined,
      lastName: payload.lastName || undefined,
      phone: payload.phone || undefined,
      company: payload.company || undefined,
      city: payload.city || undefined,
      country: payload.country || undefined,
      emailStatus: payload.emailStatus || "active",
      source: payload.source || "manual",
    };

    if (editingContact.value) {
      await contactsApi.updateContact(auth.state.token, editingContact.value.id, data);
      notice.show("Contact updated.", "success");
    } else {
      await contactsApi.createContact(auth.state.token, data);
      notice.show("Contact created.", "success");
    }
    closeContactDialog();
    await loadContacts();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to save contact";
    notice.show(message, "error");
  } finally {
    isSavingContact.value = false;
  }
}

function openDeleteContactModal(contact: ContactRow) {
  if (!canManageContact(contact)) {
    notice.show(
      "Admin should not delete another user's contact from the normal contacts route.",
      "error",
    );
    return;
  }
  deleteContactTarget.value = contact;
}

async function deleteContact() {
  if (!auth.state.token || !deleteContactTarget.value || isSavingContact.value) return;

  isSavingContact.value = true;
  try {
    await contactsApi.deleteContact(auth.state.token, deleteContactTarget.value.id);
    notice.show("Contact deleted.", "success");
    deleteContactTarget.value = null;
    await Promise.all([loadContacts(), loadTags()]);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to delete contact";
    notice.show(message, "error");
  } finally {
    isSavingContact.value = false;
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
  if (!canManageContact(contact)) {
    notice.show(
      "Admin should not edit another user's contact tags from the normal contacts route.",
      "error",
    );
    return;
  }
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
    const message = error instanceof ApiClientError ? error.message : "Failed to update tags";
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
  color: var(--color-text-faint);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-overlay-muted);
}

.modal-card {
  width: min(560px, 100%);
  border: 1px solid var(--color-modal-border);
  border-radius: 24px;
  background: linear-gradient(135deg, var(--color-surface-glass), var(--color-surface-glass-muted));
  box-shadow: 0 28px 80px var(--shadow-modal-color);
  padding: 24px;
}

.modal-card--wide {
  width: min(820px, 100%);
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

.modal-kicker {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  background: var(--color-white);
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

.contact-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.field {
  display: grid;
  gap: 8px;
  color: var(--color-text-main);
  font-weight: 700;
}

.field--wide {
  grid-column: 1 / -1;
}

.field input,
.field select {
  min-height: 46px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-white);
  color: var(--color-text-main);
  font: inherit;
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
  color: var(--color-text-subtle);
}

.empty-desc {
  font-size: 14px;
  color: var(--color-text-muted);
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
    background: var(--color-transparent);
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

  .contact-form-grid {
    grid-template-columns: 1fr;
  }

  .field--wide {
    grid-column: auto;
  }
}
</style>
