<template>
  <section class="content__header header-with-actions">
    <div>
      <h1 class="page-title">Email Contacts</h1>
      <p class="page-subtitle">
        Manage your email contacts and organize them with tags.
      </p>
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
      <select v-model="filterTag" class="filter-select">
        <option value="">All Tags</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button type="button" class="btn btn--primary" @click="applyFilters">Filter</button>
      <button type="button" class="btn btn--secondary" @click="clearFilters">Clear</button>
    </div>

    <div class="card card--table" v-if="filteredContacts.length">
      <div class="card__header">
        <h3 class="card__title">Contacts ({{ filteredContacts.length }})</h3>
        <button type="button" class="btn btn--secondary btn--sm" @click="bulkCreateTag">
          Bulk Tag
        </button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in filteredContacts" :key="contact.id">
            <td>{{ contact.name }}</td>
            <td>{{ contact.email }}</td>
            <td>{{ contact.status }}</td>
            <td>{{ formatTagNames(contact.tags) }}</td>
            <td>
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
        <p class="empty-desc">Add your first contact to get started</p>
        <RouterLink to="/contacts/ct_001/fields" class="btn btn--secondary">
          Open Contact Field Values
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const searchQuery = ref("");
const filterTag = ref("");
const filterStatus = ref("");
const appliedSearch = ref("");
const appliedTag = ref("");
const appliedStatus = ref("");

const tags = computed(() => mockWorkspace.state.tags);
const filteredContacts = computed(() => {
  return mockWorkspace.state.contacts.filter((contact) => {
    const matchesSearch =
      !appliedSearch.value ||
      contact.name.toLowerCase().includes(appliedSearch.value) ||
      contact.email.toLowerCase().includes(appliedSearch.value);
    const matchesTag =
      !appliedTag.value || contact.tags.includes(appliedTag.value);
    const matchesStatus =
      !appliedStatus.value || contact.status === appliedStatus.value;
    return matchesSearch && matchesTag && matchesStatus;
  });
});

function applyFilters() {
  appliedSearch.value = searchQuery.value.trim().toLowerCase();
  appliedTag.value = filterTag.value;
  appliedStatus.value = filterStatus.value;
  notice.show(`Showing ${filteredContacts.value.length} matching contacts.`, "info");
}

function clearFilters() {
  searchQuery.value = "";
  filterTag.value = "";
  filterStatus.value = "";
  appliedSearch.value = "";
  appliedTag.value = "";
  appliedStatus.value = "";
  notice.show("Filters cleared.", "success");
}

function addContact() {
  const email = window.prompt("Contact email", "new.contact@example.com");
  if (!email?.trim()) return;
  const name =
    window.prompt("Contact name", email.split("@")[0] || "New Contact") ||
    email.split("@")[0] ||
    "New Contact";
  const contact = mockWorkspace.addContact({ name, email, status: "active" });
  notice.show(`Added ${contact.name}.`, "success");
}

function bulkCreateTag() {
  if (!filteredContacts.value.length) {
    notice.show("No filtered contacts to tag.", "error");
    return;
  }
  notice.show("Bulk tagging is ready for backend integration; current filters are preserved.", "info");
}

function formatTagNames(tagIds: string[]) {
  const names = tagIds
    .map((id) => tags.value.find((tag) => tag.id === id)?.name)
    .filter(Boolean);
  return names.length ? names.join(", ") : "No tags";
}
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

.filter-select {
  padding: 10px 32px 10px 12px;
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
  margin: 0 0 16px;
}
</style>
