<template>
  <section class="content__header">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Live overview loaded from backend services</p>
    <p class="page-subtitle page-subtitle--muted">
      {{ scopeText }}
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
const scopeText = computed(() =>
  auth.state.user?.role === "admin"
    ? "Admin token: backend returns system-wide data on the same API URLs."
    : "User token: backend returns only records owned by the logged-in user.",
);

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
  color: var(--color-text-main);
}

.page-subtitle--muted {
  margin-top: 6px;
  font-size: 13px;
}

.card--blue {
  border-top: 3px solid var(--color-info-soft);
}

.card--green {
  border-top: 3px solid var(--color-success);
}

.card--indigo {
  border-top: 3px solid var(--color-primary-soft);
}

.card--yellow {
  border-top: 3px solid var(--color-warning-soft);
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
  background: var(--color-info-bg-active);
  color: var(--color-info-text);
}

.card--green .card__icon {
  background: var(--color-success-bg-active);
  color: var(--color-success-text);
}

.card--indigo .card__icon {
  background: var(--color-primary-bg-strong);
  color: var(--color-primary-text);
}

.card--yellow .card__icon {
  background: var(--color-warning-bg-active);
  color: var(--color-warning-text);
}

.card__label {
  font-size: 13px;
  color: var(--color-text-muted);
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
  box-shadow: 0 22px 45px var(--shadow-card-strong-color);
}

.card__icon--purple {
  background: var(--color-purple-bg-strong);
  color: var(--color-purple-strong);
}

.card__icon--blue {
  background: var(--color-info-bg-active);
  color: var(--color-info);
}

.card__icon--teal {
  background: var(--color-cyan-bg-strong);
  color: var(--color-cyan-text);
}

.card__icon--green {
  background: var(--color-success-bg-strong);
  color: var(--color-success-text);
}

.card__title {
  font-weight: 600;
  font-size: 14px;
}

.card__text {
  font-size: 12px;
  color: var(--color-text-muted);
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
  color: var(--color-primary);
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
  background: var(--color-info-bg-strong);
  color: var(--color-info);
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
  color: var(--color-text-muted);
}

.activity__time {
  font-size: 11px;
  color: var(--color-text-soft);
  white-space: nowrap;
}

.empty-text {
  color: var(--color-text-muted);
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
  color: var(--color-text-subtle);
}

.performance__value {
  font-weight: 500;
  color: var(--color-text-strong);
}

.performance__bar {
  grid-column: 1 / -1;
  height: 6px;
  border-radius: 999px;
  background: var(--color-border-subtle);
  position: relative;
  overflow: hidden;
}

.performance__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.performance__bar--blue span {
  background: linear-gradient(90deg, var(--color-info-accent), var(--color-primary-soft));
}

.performance__bar--green span {
  background: linear-gradient(90deg, var(--color-success), var(--color-success-strong));
}

.performance__bar--orange span {
  background: linear-gradient(90deg, var(--color-orange-soft), var(--color-orange));
}

.performance__bar--red span {
  background: linear-gradient(90deg, var(--color-danger-muted), var(--color-danger-soft));
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
  .grid--stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .grid--actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .card--stat {
    min-height: 112px;
  }

  .card__icon {
    width: auto;
    min-width: 46px;
    height: 30px;
    padding: 0 8px;
    font-size: 11px;
  }

  .card__value {
    font-size: 22px;
  }

  .card--action {
    min-height: 118px;
  }

  .activity-item {
    align-items: flex-start;
  }

  .activity__time {
    display: none;
  }
}

@media (max-width: 380px) {
  .grid--stats,
  .grid--actions {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
