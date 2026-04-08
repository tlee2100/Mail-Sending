<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Campaigns</h1>
      <p class="page-subtitle">Campaign list from backend</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="createCampaign">
      + New Campaign
    </button>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table" v-if="campaigns.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Recipients</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in campaigns" :key="item.id">
            <td>{{ item.campaign_name }}</td>
            <td><span class="badge">{{ item.status }}</span></td>
            <td>{{ item.total_recipients || 0 }}</td>
            <td>{{ formatDate(item.updated_at || item.created_at) }}</td>
            <td class="actions">
              <RouterLink :to="`/campaigns/${item.id}`" class="btn btn--secondary btn--small">
                Detail
              </RouterLink>
              <RouterLink :to="`/campaigns/${item.id}/recipients`" class="btn btn--secondary btn--small">
                Recipients
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-text">No campaigns found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { campaignsApi } from "../api/campaignsApi";
import { contactsApi } from "../api/contactsApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { templatesApi } from "../api/templatesApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type CampaignRow = Record<string, any>;

const notice = useNotice();
const campaigns = ref<CampaignRow[]>([]);

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

async function loadCampaigns() {
  if (!auth.state.token) return;
  try {
    const response = await campaignsApi.list(auth.state.token);
    campaigns.value = response.data.items;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load campaigns";
    notice.show(message, "error");
  }
}

async function createCampaign() {
  if (!auth.state.token) return;
  try {
    const [templatesRes, accountsRes, contactsRes] = await Promise.all([
      templatesApi.listTemplates(auth.state.token, { pageSize: 1 }),
      emailAccountsApi.list(auth.state.token),
      contactsApi.listContacts(auth.state.token, { pageSize: 5, status: "active" }),
    ]);

    const firstTemplate = templatesRes.data.items[0];
    const firstAccount = accountsRes.data[0];
    const contactIds = contactsRes.data.items.map((item: any) => Number(item.id));

    if (!firstTemplate && !firstAccount) {
      notice.show(
        "Cannot create campaign. The current account needs at least one template and one email account.",
        "error",
      );
      return;
    }

    if (!firstTemplate) {
      notice.show(
        "Cannot create campaign. The current account does not have any email template yet.",
        "error",
      );
      return;
    }

    if (!firstAccount) {
      notice.show(
        "Cannot create campaign. The current account does not have any email account yet.",
        "error",
      );
      return;
    }

    const campaignName = window.prompt("Campaign name", "Spring Launch");
    if (!campaignName?.trim()) return;

    await campaignsApi.create(auth.state.token, {
      campaignName: campaignName.trim(),
      templateId: Number(firstTemplate.id),
      emailAccountId: Number(firstAccount.id),
      campaignType: "regular",
      contactIds,
    });
    notice.show("Campaign created.", "success");
    await loadCampaigns();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to create campaign";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadCampaigns();
});
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
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
}

.table th {
  color: var(--color-text-muted);
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg-muted);
  color: var(--color-text-main);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn--small { padding: 6px 10px; font-size: 12px; text-decoration: none; }
.empty-text { padding: 18px; color: var(--color-text-muted); }
</style>
