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
            <th>Company</th>
            <th>City</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in contacts" :key="contact.id">
            <td>{{ fullName(contact) }}</td>
            <td>{{ contact.email }}</td>
            <td>{{ contact.email_status || "active" }}</td>
            <td>{{ contact.company || "-" }}</td>
            <td>{{ contact.city || "-" }}</td>
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
        <p class="empty-desc">Create a contact or adjust filters.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
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
};

const notice = useNotice();
const contacts = ref<ContactRow[]>([]);
const searchQuery = ref("");
const filterStatus = ref("");
const filterCity = ref("");
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
    });

    contacts.value = response.data.items as ContactRow[];
    Object.assign(pagination, response.data.pagination);
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load contacts";
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
  void loadContacts();
}

onMounted(() => {
  void loadContacts();
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
  margin: 0;
}
</style>
