<template>
  <section class="content__header header-row">
    <div>
      <p class="eyebrow">Administration</p>
      <h1 class="page-title">User Management</h1>
      <p class="page-subtitle">Change roles and lock or unlock user accounts.</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--secondary" @click="loadUsers">
      Refresh
    </button>
  </section>

  <section class="grid stats-grid">
    <article class="card stat-card">
      <span>Total users</span>
      <strong>{{ users.length }}</strong>
    </article>
    <article class="card stat-card">
      <span>Admins</span>
      <strong>{{ adminCount }}</strong>
    </article>
    <article class="card stat-card">
      <span>Active</span>
      <strong>{{ activeCount }}</strong>
    </article>
  </section>

  <section class="content__section">
    <div class="filter-bar">
      <input v-model.trim="search" type="search" placeholder="Search users..." />
      <select v-model="roleFilter">
        <option value="">All roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      <select v-model="statusFilter">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="disabled">Disabled</option>
      </select>
    </div>

    <div class="card table-card">
      <table v-if="filteredUsers.length" class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Last login</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <strong>{{ user.name || "Unnamed user" }}</strong>
              <span>{{ user.email || "-" }}</span>
            </td>
            <td data-label="Role">
              <select
                :value="roleOf(user)"
                :disabled="isCurrentUser(user) || savingId === `role:${user.id}`"
                @change="changeRoleFromEvent(user, $event)"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td data-label="Status">
              <span class="pill" :class="{ 'pill--off': !isActive(user) }">
                {{ isActive(user) ? "Active" : "Disabled" }}
              </span>
            </td>
            <td data-label="Created">{{ formatDate(user.created_at) }}</td>
            <td data-label="Last login">{{ formatDate(user.last_login_at) }}</td>
            <td class="actions">
              <button
                type="button"
                class="btn btn--secondary btn--small"
                :disabled="isCurrentUser(user) || savingId === `status:${user.id}`"
                @click="toggleStatus(user)"
              >
                {{ isActive(user) ? "Lock" : "Unlock" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h2>No users found.</h2>
        <p>Try clearing filters or refresh the user list.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { adminApi, type AdminUserRow, type AdminUsersResponse } from "../api/adminApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const notice = useNotice();
const users = ref<AdminUserRow[]>([]);
const search = ref("");
const roleFilter = ref("");
const statusFilter = ref("");
const savingId = ref("");

const filteredUsers = computed(() => {
  const query = search.value.toLowerCase();
  return users.value.filter((user) => {
    const matchesSearch =
      !query ||
      String(user.name || "").toLowerCase().includes(query) ||
      String(user.email || "").toLowerCase().includes(query);
    const matchesRole = !roleFilter.value || roleOf(user) === roleFilter.value;
    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === "active" ? isActive(user) : !isActive(user));
    return matchesSearch && matchesRole && matchesStatus;
  });
});

const adminCount = computed(
  () => users.value.filter((user) => roleOf(user) === "admin").length,
);
const activeCount = computed(() => users.value.filter(isActive).length);

function extractUsers(data: AdminUsersResponse) {
  if (Array.isArray(data)) return data;
  return data.items || data.users || [];
}

function roleOf(user: AdminUserRow) {
  return String(user.role || "").toLowerCase() === "admin" ? "admin" : "user";
}

function isActive(user: AdminUserRow) {
  if (typeof user.isActive === "boolean") return user.isActive;
  if (typeof user.is_active === "boolean") return user.is_active;
  return true;
}

function isCurrentUser(user: AdminUserRow) {
  return Number(user.id) === Number(auth.state.user?.id);
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

async function loadUsers() {
  if (!auth.state.token) return;
  try {
    const response = await adminApi.listUsers(auth.state.token);
    users.value = extractUsers(response.data);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to load users";
    notice.show(message, "error");
  }
}

async function changeRole(user: AdminUserRow, nextRole: string) {
  if (!auth.state.token || isCurrentUser(user)) return;
  const role = nextRole === "admin" ? "admin" : "user";
  if (roleOf(user) === role) return;

  savingId.value = `role:${user.id}`;
  try {
    await adminApi.updateUserRole(auth.state.token, user.id, role);
    notice.show("User role updated.", "success");
    await loadUsers();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to update role";
    notice.show(message, "error");
  } finally {
    savingId.value = "";
  }
}

function changeRoleFromEvent(user: AdminUserRow, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  void changeRole(user, value);
}

async function toggleStatus(user: AdminUserRow) {
  if (!auth.state.token || isCurrentUser(user)) return;
  savingId.value = `status:${user.id}`;
  try {
    await adminApi.updateUserStatus(auth.state.token, user.id, !isActive(user));
    notice.show("User status updated.", "success");
    await loadUsers();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to update status";
    notice.show(message, "error");
  } finally {
    savingId.value = "";
  }
}

onMounted(() => {
  void loadUsers();
});
</script>

<style scoped>
.header-row {
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

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-card {
  border: 1px solid var(--color-border-subtle);
}

.stat-card span {
  color: var(--color-text-muted);
  font-size: 13px;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  color: var(--color-text-main);
  font-size: 28px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-bar input,
.filter-bar select,
.table select {
  min-height: 40px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
  padding: 0 12px;
}

.filter-bar input {
  flex: 1;
  min-width: 220px;
}

.table-card {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: left;
  font-size: 13px;
}

.table td:first-child span {
  display: block;
  color: var(--color-text-muted);
}

.pill {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--color-success-bg);
  color: var(--color-success-text-strong);
  font-size: 12px;
  font-weight: 800;
}

.pill--off {
  background: var(--color-danger-bg-subtle);
  color: var(--color-danger-text);
}

.actions {
  text-align: right;
}

.btn--small {
  padding: 7px 11px;
  font-size: 12px;
}

.empty-state {
  padding: 36px 12px;
  text-align: center;
}

.empty-state p {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar input,
  .filter-bar select {
    width: 100%;
  }
}
</style>
