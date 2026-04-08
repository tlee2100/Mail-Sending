<template>
  <section class="content__header">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Live overview loaded from backend services</p>
    <p class="page-subtitle page-subtitle--muted">
      Counts only include records that belong to the currently logged-in backend user.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="grid grid--stats">
    <div class="card card--stat card--blue">
      <div class="card__icon">Accounts</div>
      <div class="card__label">Total Accounts</div>
      <div class="card__value">{{ stats.total_accounts }}</div>
    </div>
    <div class="card card--stat card--green">
      <div class="card__icon">Live</div>
      <div class="card__label">Active Accounts</div>
      <div class="card__value">{{ stats.active_accounts }}</div>
    </div>
    <div class="card card--stat card--indigo">
      <div class="card__icon">Default</div>
      <div class="card__label">Default Account</div>
      <div class="card__value">{{ defaultAccountCount }}</div>
    </div>
    <div class="card card--stat card--yellow">
      <div class="card__icon">Sent</div>
      <div class="card__label">Emails Sent</div>
      <div class="card__value">{{ stats.total_sent }}</div>
    </div>
  </section>

  <section class="content__section">
    <h2 class="section-title">Quick Actions</h2>
    <div class="grid grid--actions">
      <RouterLink to="/campaigns" class="card card--action">
        <div class="card__icon card__icon--purple">Camp</div>
        <div class="card__title">Campaigns</div>
        <div class="card__text">Create and monitor campaigns</div>
      </RouterLink>
      <RouterLink to="/email-templates" class="card card--action">
        <div class="card__icon card__icon--blue">Tpl</div>
        <div class="card__title">Templates</div>
        <div class="card__text">Manage email templates</div>
      </RouterLink>
      <RouterLink to="/email-contacts" class="card card--action">
        <div class="card__icon card__icon--teal">List</div>
        <div class="card__title">Contacts</div>
        <div class="card__text">Browse live contact data</div>
      </RouterLink>
      <RouterLink to="/email-accounts" class="card card--action">
        <div class="card__icon card__icon--green">SMTP</div>
        <div class="card__title">Email Accounts</div>
        <div class="card__text">Manage sender accounts</div>
      </RouterLink>
    </div>
  </section>

  <section class="content__section content__section--bottom">
    <div class="grid grid--bottom">
      <div class="card card--panel">
        <div class="card__header">
          <div class="card__title">Recent Activity</div>
          <RouterLink to="/campaigns" class="link-button">View All</RouterLink>
        </div>
        <ul class="activity-list" v-if="recentActivity.length">
          <li
            v-for="activity in recentActivity"
            :key="String(activity.id)"
            class="activity-item"
          >
            <div class="activity__icon activity__icon--blue">Log</div>
            <div class="activity__body">
              <div class="activity__title">{{ activity.email || "Email log" }}</div>
              <div class="activity__desc">
                {{ activity.message || activity.status || "No message" }}
              </div>
            </div>
            <div class="activity__time">{{ formatRelativeTime(activity.sent_time) }}</div>
          </li>
        </ul>
        <p v-else class="empty-text">No recent activity found in backend logs.</p>
      </div>
      <div class="card card--panel">
        <div class="card__header">
          <div class="card__title">Email Performance</div>
        </div>
        <div class="performance-list">
          <div class="performance-item">
            <div class="performance__label">Open Rate</div>
            <div class="performance__value">{{ performance.openRate }}%</div>
            <div class="performance__bar performance__bar--blue">
              <span :style="{ width: `${performance.openRate}%` }"></span>
            </div>
          </div>
          <div class="performance-item">
            <div class="performance__label">Click Rate</div>
            <div class="performance__value">{{ performance.clickRate }}%</div>
            <div class="performance__bar performance__bar--green">
              <span :style="{ width: `${performance.clickRate}%` }"></span>
            </div>
          </div>
          <div class="performance-item">
            <div class="performance__label">Bounce Rate</div>
            <div class="performance__value">{{ bounceRate }}%</div>
            <div class="performance__bar performance__bar--orange">
              <span :style="{ width: `${bounceRate}%` }"></span>
            </div>
          </div>
          <div class="performance-item">
            <div class="performance__label">Unsubscribe Rate</div>
            <div class="performance__value">{{ unsubscribeRate }}%</div>
            <div class="performance__bar performance__bar--red">
              <span :style="{ width: `${unsubscribeRate}%` }"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { dashboardApi } from "../api/dashboardApi";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type DashboardStats = {
  total_accounts: number;
  active_accounts: number;
  active_contacts: number;
  active_templates: number;
  total_campaigns: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
};

const notice = useNotice();
const stats = reactive<DashboardStats>({
  total_accounts: 0,
  active_accounts: 0,
  active_contacts: 0,
  active_templates: 0,
  total_campaigns: 0,
  total_sent: 0,
  total_opened: 0,
  total_clicked: 0,
});
const performance = reactive({
  openRate: 0,
  clickRate: 0,
});
const recentActivity = ref<Array<Record<string, any>>>([]);
const defaultAccountCount = ref(0);

const bounceRate = computed(() => 0);
const unsubscribeRate = computed(() => 0);

function formatRelativeTime(value: unknown) {
  if (!value) return "N/A";
  const date = new Date(String(value));
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (!Number.isFinite(diffMinutes)) return String(value);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

async function loadDashboard() {
  if (!auth.state.token) {
    notice.show("Missing auth token. Please login again.", "error");
    return;
  }

  try {
    const [overviewRes, accountsRes] = await Promise.all([
      dashboardApi.overview(auth.state.token),
      emailAccountsApi.list(auth.state.token),
    ]);

    Object.assign(stats, overviewRes.data.stats);
    Object.assign(performance, overviewRes.data.performance);
    recentActivity.value = overviewRes.data.recentActivity || [];
    defaultAccountCount.value = (accountsRes.data || []).filter(
      (item) => item.is_default === true,
    ).length;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load dashboard";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadDashboard();
});
</script>

<style scoped>
.grid--stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid--actions {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid--bottom {
  grid-template-columns: 2fr 1.6fr;
}

.content__section--bottom {
  margin-top: 24px;
}

.card--stat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #0f172a;
}

.page-subtitle--muted {
  margin-top: 6px;
  font-size: 13px;
}

.card--blue {
  border-top: 3px solid #3b82f6;
}

.card--green {
  border-top: 3px solid #22c55e;
}

.card--indigo {
  border-top: 3px solid #6366f1;
}

.card--yellow {
  border-top: 3px solid #facc15;
}

.card__icon {
  width: 54px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.card--blue .card__icon {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.card--green .card__icon {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.card--indigo .card__icon {
  background: rgba(79, 70, 229, 0.14);
  color: #4338ca;
}

.card--yellow .card__icon {
  background: rgba(250, 204, 21, 0.16);
  color: #a16207;
}

.card__label {
  font-size: 13px;
  color: #6b7280;
}

.card__value {
  font-size: 24px;
  font-weight: 600;
}

.card--action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  text-decoration: none;
  color: inherit;
}

.card--action:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 45px rgba(15, 23, 42, 0.12);
}

.card__icon--purple {
  background: rgba(168, 85, 247, 0.14);
  color: #7c3aed;
}

.card__icon--blue {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.card__icon--teal {
  background: rgba(45, 212, 191, 0.14);
  color: #0f766e;
}

.card__icon--green {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.card__title {
  font-weight: 600;
  font-size: 14px;
}

.card__text {
  font-size: 12px;
  color: #6b7280;
}

.card--panel {
  padding: 18px 18px 20px;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.link-button {
  border: none;
  background: none;
  color: #4f46e5;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}

.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 10px;
}

.activity__icon {
  width: 44px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.activity__icon--blue {
  background: rgba(59, 130, 246, 0.14);
  color: #2563eb;
}

.activity__body {
  flex: 1;
}

.activity__title {
  font-size: 13px;
  font-weight: 500;
}

.activity__desc {
  font-size: 12px;
  color: #6b7280;
}

.activity__time {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}

.empty-text {
  color: #6b7280;
  font-size: 13px;
}

.performance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.performance-item {
  display: grid;
  grid-template-columns: 1.2fr auto;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}

.performance__label {
  color: #4b5563;
}

.performance__value {
  font-weight: 500;
  color: #111827;
}

.performance__bar {
  grid-column: 1 / -1;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  position: relative;
  overflow: hidden;
}

.performance__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.performance__bar--blue span {
  background: linear-gradient(90deg, #38bdf8, #6366f1);
}

.performance__bar--green span {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.performance__bar--orange span {
  background: linear-gradient(90deg, #fb923c, #f97316);
}

.performance__bar--red span {
  background: linear-gradient(90deg, #f97373, #ef4444);
}

@media (max-width: 1024px) {
  .grid--stats,
  .grid--actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid--bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .grid--stats,
  .grid--actions {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
