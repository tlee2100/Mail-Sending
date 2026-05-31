<template>
  <section class="content__header">
    <h1 class="page-title">Usage & Limits</h1>
    <p class="page-subtitle">
      Usage is calculated from the role-aware dashboard and sender account APIs.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="grid stats-grid">
    <article class="card stat-card">
      <span>Emails sent</span>
      <strong>{{ stats.total_sent || 0 }}</strong>
    </article>
    <article class="card stat-card">
      <span>Campaigns</span>
      <strong>{{ stats.total_campaigns || 0 }}</strong>
    </article>
    <article class="card stat-card">
      <span>Contacts</span>
      <strong>{{ stats.active_contacts || 0 }}</strong>
    </article>
    <article class="card stat-card">
      <span>Templates</span>
      <strong>{{ stats.active_templates || 0 }}</strong>
    </article>
  </section>

  <section class="content__section">
    <div class="card account-card">
      <div class="panel-head">
        <h2>Sender Limits</h2>
        <button type="button" class="btn btn--secondary btn--small" @click="loadUsage">
          Refresh
        </button>
      </div>
      <div v-if="accounts.length" class="account-list">
        <article v-for="account in accounts" :key="account.id" class="account-row">
          <div>
            <strong>{{ account.display_name || account.email_address }}</strong>
            <span>{{ account.email_address }} - {{ account.status || "active" }}</span>
          </div>
          <div class="limit-box">
            <span>{{ Number(account.sent_today || 0) }} / {{ Number(account.daily_limit || 0) || "unlimited" }}</span>
            <div class="bar">
              <i :style="{ width: `${limitPercent(account)}%` }"></i>
            </div>
          </div>
        </article>
      </div>
      <p v-else class="empty-text">No sender accounts found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { dashboardApi } from "../api/dashboardApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type AccountRow = Record<string, any>;

const notice = useNotice();
const stats = reactive<Record<string, number>>({});
const accounts = ref<AccountRow[]>([]);

function limitPercent(account: AccountRow) {
  const limit = Number(account.daily_limit || 0);
  if (!limit) return 0;
  return Math.min(100, Math.round((Number(account.sent_today || 0) / limit) * 100));
}

async function loadUsage() {
  if (!auth.state.token) return;
  try {
    const [overviewRes, accountsRes] = await Promise.all([
      dashboardApi.overview(auth.state.token),
      emailAccountsApi.list(auth.state.token),
    ]);
    Object.assign(stats, overviewRes.data.stats || {});
    accounts.value = accountsRes.data || [];
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to load usage";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadUsage();
});
</script>

<style scoped>
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

.account-card {
  border: 1px solid var(--color-border-subtle);
}

.panel-head,
.account-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head h2 {
  margin: 0;
  color: var(--color-text-main);
  font-size: 17px;
  font-weight: 800;
}

.account-list {
  display: grid;
  gap: 12px;
}

.account-row {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.account-row:last-child {
  border-bottom: none;
}

.account-row strong {
  display: block;
  color: var(--color-text-main);
}

.account-row span,
.empty-text {
  color: var(--color-text-muted);
  font-size: 13px;
}

.limit-box {
  min-width: 220px;
}

.bar {
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-border-subtle);
}

.bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-accent));
}

.btn--small {
  padding: 7px 11px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-grid,
  .account-row {
    grid-template-columns: 1fr;
  }

  .account-row {
    display: grid;
  }

  .limit-box {
    min-width: 0;
  }
}
</style>
