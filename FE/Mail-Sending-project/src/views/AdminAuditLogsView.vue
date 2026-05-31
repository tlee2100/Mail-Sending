<template>
  <section class="content__header header-row">
    <div>
      <p class="eyebrow">Administration</p>
      <h1 class="page-title">Audit Logs</h1>
      <p class="page-subtitle">
        Displays backend recent activity from the role-aware dashboard endpoint.
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--secondary" @click="loadLogs">
      Refresh
    </button>
  </section>

  <section class="content__section">
    <div class="card log-card">
      <div v-if="logs.length" class="log-list">
        <article v-for="log in logs" :key="String(log.id || log.sent_time || log.created_at)" class="log-row">
          <div class="log-marker"></div>
          <div class="log-body">
            <div class="log-title">{{ titleOf(log) }}</div>
            <div class="log-meta">
              {{ ownerLabel(log) }} - {{ formatDate(log.sent_time || log.created_at || log.updated_at) }}
            </div>
            <p>{{ log.message || log.status || log.event || "No message" }}</p>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        <h2>No activity found.</h2>
        <p>The backend did not return recent activity for this admin token.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { dashboardApi } from "../api/dashboardApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type LogRow = Record<string, any>;

const notice = useNotice();
const logs = ref<LogRow[]>([]);

function titleOf(log: LogRow) {
  return (
    log.email ||
    log.campaign_name ||
    log.template_name ||
    log.action ||
    log.type ||
    "Activity"
  );
}

function ownerLabel(log: LogRow) {
  const owner =
    log.owner && typeof log.owner === "object"
      ? (log.owner as Record<string, any>)
      : null;
  const name = owner?.name || log.owner_name || log.user_name;
  const email = owner?.email || log.owner_email || log.user_email;
  const id = owner?.id || log.owner_id || log.user_id || log.userId;
  if (name && email) return `${name} (${email})`;
  if (name || email) return String(name || email);
  if (id) return `User #${id}`;
  return "System";
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

async function loadLogs() {
  if (!auth.state.token) return;
  try {
    const response = await dashboardApi.overview(auth.state.token);
    logs.value = response.data.recentActivity || [];
  } catch (error) {
    const message = error instanceof ApiClientError ? error.message : "Failed to load audit logs";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadLogs();
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

.log-card {
  border: 1px solid var(--color-border-subtle);
}

.log-list {
  display: grid;
  gap: 14px;
}

.log-row {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.log-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.log-marker {
  width: 12px;
  min-height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--color-primary), var(--color-primary-accent));
}

.log-title {
  color: var(--color-text-main);
  font-weight: 800;
}

.log-meta {
  color: var(--color-text-muted);
  font-size: 12px;
}

.log-body p,
.empty-state p {
  margin: 6px 0 0;
  color: var(--color-text-muted);
}

.empty-state {
  padding: 36px 12px;
  text-align: center;
}
</style>
