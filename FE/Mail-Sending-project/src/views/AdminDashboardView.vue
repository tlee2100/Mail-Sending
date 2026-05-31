<template>
  <section class="content__header header-row">
    <div>
      <p class="eyebrow">Administration</p>
      <h1 class="page-title">Admin Dashboard</h1>
      <p class="page-subtitle">
        Uses the normal list APIs. Admin tokens receive system-wide data, optionally filtered by user.
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <div class="filter-card">
      <label>
        Scope
        <select v-model="selectedUserId" @change="loadAdminData">
          <option value="">All users</option>
          <option v-for="user in users" :key="user.id" :value="String(user.id)">
            {{ user.name || user.email || `User #${user.id}` }}
          </option>
        </select>
      </label>
    </div>
  </section>

  <section class="grid stats-grid">
    <article v-for="item in statCards" :key="item.label" class="card stat-card">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </section>

  <section class="grid panel-grid">
    <article class="card panel">
      <div class="panel-head">
        <h2>Campaigns</h2>
        <RouterLink to="/campaigns" class="link-button">Open list</RouterLink>
      </div>
      <div v-if="campaigns.length" class="row-list">
        <div v-for="campaign in campaigns" :key="campaign.id" class="data-row">
          <div>
            <strong>{{ campaign.campaign_name || `Campaign #${campaign.id}` }}</strong>
            <span>{{ ownerLabel(campaign) }} - {{ campaign.status || "draft" }}</span>
          </div>
          <div class="row-actions">
            <button type="button" class="btn btn--secondary btn--small" @click="pauseCampaign(campaign)">
              Pause
            </button>
            <button type="button" class="btn btn--danger btn--small" @click="deleteCampaign(campaign)">
              Delete
            </button>
          </div>
        </div>
      </div>
      <p v-else class="empty-text">No campaigns in this scope.</p>
    </article>

    <article class="card panel">
      <div class="panel-head">
        <h2>Templates</h2>
        <RouterLink to="/email-templates" class="link-button">Open list</RouterLink>
      </div>
      <div v-if="templates.length" class="row-list">
        <div v-for="template in templates" :key="template.id" class="data-row">
          <div>
            <strong>{{ template.template_name || `Template #${template.id}` }}</strong>
            <span>{{ ownerLabel(template) }} - {{ template.is_active === false ? "Inactive" : "Active" }}</span>
          </div>
          <button type="button" class="btn btn--danger btn--small" @click="deleteTemplate(template)">
            Delete
          </button>
        </div>
      </div>
      <p v-else class="empty-text">No templates in this scope.</p>
    </article>

    <article class="card panel">
      <div class="panel-head">
        <h2>Contacts</h2>
        <RouterLink to="/email-contacts" class="link-button">Open list</RouterLink>
      </div>
      <div v-if="contacts.length" class="row-list">
        <div v-for="contact in contacts" :key="contact.id" class="data-row">
          <div>
            <strong>{{ contact.email || `Contact #${contact.id}` }}</strong>
            <span>{{ ownerLabel(contact) }} - {{ contact.email_status || "active" }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty-text">No contacts in this scope.</p>
    </article>

    <article class="card panel">
      <div class="panel-head">
        <h2>Email Accounts</h2>
        <RouterLink to="/email-accounts" class="link-button">Open list</RouterLink>
      </div>
      <div v-if="accounts.length" class="row-list">
        <div v-for="account in accounts" :key="account.id" class="data-row">
          <div>
            <strong>{{ account.display_name || account.email_address || `Account #${account.id}` }}</strong>
            <span>{{ ownerLabel(account) }} - {{ account.status || "active" }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty-text">No email accounts in this scope.</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { adminApi, type AdminUserRow, type AdminUsersResponse } from "../api/adminApi";
import { campaignsApi } from "../api/campaignsApi";
import { contactsApi } from "../api/contactsApi";
import { dashboardApi } from "../api/dashboardApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { ApiClientError } from "../api/http";
import { templatesApi } from "../api/templatesApi";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type DataRow = Record<string, any>;

const notice = useNotice();
const users = ref<AdminUserRow[]>([]);
const selectedUserId = ref("");
const contacts = ref<DataRow[]>([]);
const templates = ref<DataRow[]>([]);
const campaigns = ref<DataRow[]>([]);
const accounts = ref<DataRow[]>([]);
const stats = reactive<Record<string, number>>({});

const scopedUserId = computed(() =>
  selectedUserId.value ? Number(selectedUserId.value) : undefined,
);

const statCards = computed(() => [
  { label: "Contacts", value: stats.active_contacts ?? contacts.value.length },
  { label: "Templates", value: stats.active_templates ?? templates.value.length },
  { label: "Campaigns", value: stats.total_campaigns ?? campaigns.value.length },
  { label: "Email Accounts", value: stats.total_accounts ?? accounts.value.length },
]);

function extractUsers(data: AdminUsersResponse) {
  if (Array.isArray(data)) return data;
  return data.items || data.users || [];
}

function ownerLabel(item: DataRow) {
  const owner =
    item.owner && typeof item.owner === "object"
      ? (item.owner as Record<string, any>)
      : null;
  const name = owner?.name || item.owner_name || item.user_name;
  const email = owner?.email || item.owner_email || item.user_email;
  const id = owner?.id || item.owner_id || item.user_id || item.userId;
  if (name && email) return `${name} (${email})`;
  if (name || email) return String(name || email);
  if (id) return `User #${id}`;
  return "No owner";
}

async function loadUsers() {
  if (!auth.state.token) return;
  const response = await adminApi.listUsers(auth.state.token);
  users.value = extractUsers(response.data);
}

async function loadAdminData() {
  if (!auth.state.token) return;
  const query = scopedUserId.value ? { userId: scopedUserId.value } : undefined;

  try {
    const [overviewRes, contactsRes, templatesRes, campaignsRes, accountsRes] =
      await Promise.all([
        dashboardApi.overview(auth.state.token, query),
        contactsApi.listContacts(auth.state.token, { pageSize: 5, ...(query || {}) }),
        templatesApi.listTemplates(auth.state.token, { pageSize: 5, ...(query || {}) }),
        campaignsApi.list(auth.state.token, { pageSize: 5, ...(query || {}) }),
        emailAccountsApi.list(auth.state.token, query),
      ]);

    Object.assign(stats, overviewRes.data.stats || {});
    contacts.value = contactsRes.data.items || [];
    templates.value = templatesRes.data.items || [];
    campaigns.value = campaignsRes.data.items || [];
    accounts.value = accountsRes.data || [];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load admin dashboard";
    notice.show(message, "error");
  }
}

async function deleteTemplate(template: DataRow) {
  if (!auth.state.token) return;
  if (!window.confirm(`Delete template ${template.template_name || template.id}?`)) return;
  try {
    await adminApi.deleteTemplate(auth.state.token, template.id);
    notice.show("Template deleted.", "success");
    await loadAdminData();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to delete template";
    notice.show(message, "error");
  }
}

async function pauseCampaign(campaign: DataRow) {
  if (!auth.state.token) return;
  try {
    await adminApi.pauseCampaign(auth.state.token, campaign.id);
    notice.show("Campaign paused.", "success");
    await loadAdminData();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to pause campaign";
    notice.show(message, "error");
  }
}

async function deleteCampaign(campaign: DataRow) {
  if (!auth.state.token) return;
  if (!window.confirm(`Delete campaign ${campaign.campaign_name || campaign.id}?`)) return;
  try {
    await adminApi.deleteCampaign(auth.state.token, campaign.id);
    notice.show("Campaign deleted.", "success");
    await loadAdminData();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to delete campaign";
    notice.show(message, "error");
  }
}

onMounted(async () => {
  try {
    await loadUsers();
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to load users";
    notice.show(message, "error");
  }
  await loadAdminData();
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

.filter-card {
  min-width: 240px;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-bg-surface-elevated);
}

.filter-card label {
  display: grid;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.filter-card select {
  min-height: 40px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
  padding: 0 10px;
}

.stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.panel-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 24px;
}

.panel {
  border: 1px solid var(--color-border-subtle);
}

.panel-head,
.data-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.panel-head {
  margin-bottom: 14px;
}

.panel h2 {
  margin: 0;
  color: var(--color-text-main);
  font-size: 16px;
  font-weight: 700;
}

.link-button {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.row-list {
  display: grid;
  gap: 12px;
}

.data-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.data-row:last-child {
  border-bottom: none;
}

.data-row strong {
  display: block;
  color: var(--color-text-main);
}

.data-row span,
.empty-text {
  color: var(--color-text-muted);
  font-size: 13px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.btn--small {
  padding: 7px 11px;
  font-size: 12px;
}

@media (max-width: 980px) {
  .stats-grid,
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .filter-card {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .data-row,
  .row-actions {
    display: grid;
    width: 100%;
  }
}
</style>
