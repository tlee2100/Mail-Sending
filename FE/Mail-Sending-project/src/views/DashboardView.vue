<template>
  <section class="content__header dashboard-hero">
    <div class="hero__copy">
      <span class="hero__eyebrow">Email command center</span>
      <h1 class="page-title">ChadMailer Dashboard</h1>
      <p class="page-subtitle">
        Track sender health, campaign velocity and delivery performance in one
        colorful workspace.
      </p>
      <div class="hero__actions">
        <RouterLink to="/individual-emails/compose" class="btn btn--primary">
          Compose Email
        </RouterLink>
        <RouterLink to="/campaigns" class="btn btn--secondary">
          View Campaigns
        </RouterLink>
      </div>
      <p class="hero__scope">{{ scopeText }}</p>
    </div>
    <div class="hero__visual" aria-hidden="true">
      <div class="mail-orbit mail-orbit--one"></div>
      <div class="mail-orbit mail-orbit--two"></div>
      <div class="mail-card">
        <div class="mail-card__top">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="mail-card__envelope">
          <div class="envelope__flap"></div>
          <div class="envelope__line envelope__line--one"></div>
          <div class="envelope__line envelope__line--two"></div>
        </div>
        <div class="mail-card__route">
          <span class="route-dot"></span>
          <span class="route-line"></span>
          <span class="route-dot route-dot--hot"></span>
          <span class="route-line"></span>
          <span class="route-dot route-dot--ok"></span>
        </div>
      </div>
    </div>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="grid grid--stats">
    <div class="card card--stat card--blue">
      <div class="card__shine"></div>
      <div class="card__icon">Accounts</div>
      <div class="card__label">Total Accounts</div>
      <div class="card__value">{{ stats.total_accounts }}</div>
    </div>
    <div class="card card--stat card--green">
      <div class="card__shine"></div>
      <div class="card__icon">Live</div>
      <div class="card__label">Active Accounts</div>
      <div class="card__value">{{ stats.active_accounts }}</div>
    </div>
    <div class="card card--stat card--indigo">
      <div class="card__shine"></div>
      <div class="card__icon">Default</div>
      <div class="card__label">Default Account</div>
      <div class="card__value">{{ defaultAccountCount }}</div>
    </div>
    <div class="card card--stat card--yellow">
      <div class="card__shine"></div>
      <div class="card__icon">Sent</div>
      <div class="card__label">Emails Sent</div>
      <div class="card__value">{{ stats.total_sent }}</div>
    </div>
  </section>

  <section class="content__section">
    <h2 class="section-title">Quick Actions</h2>
    <div class="grid grid--actions">
      <RouterLink to="/campaigns" class="card card--action">
        <div class="card__spark card__spark--purple"></div>
        <div class="card__icon card__icon--purple">Camp</div>
        <div class="card__title">Campaigns</div>
        <div class="card__text">Create and monitor campaigns</div>
      </RouterLink>
      <RouterLink to="/email-templates" class="card card--action">
        <div class="card__spark card__spark--blue"></div>
        <div class="card__icon card__icon--blue">Tpl</div>
        <div class="card__title">Templates</div>
        <div class="card__text">Manage email templates</div>
      </RouterLink>
      <RouterLink to="/email-contacts" class="card card--action">
        <div class="card__spark card__spark--teal"></div>
        <div class="card__icon card__icon--teal">List</div>
        <div class="card__title">Contacts</div>
        <div class="card__text">Browse live contact data</div>
      </RouterLink>
      <RouterLink to="/email-accounts" class="card card--action">
        <div class="card__spark card__spark--green"></div>
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
.dashboard-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: 24px;
  align-items: center;
  min-height: 270px;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: var(--radius-panel);
  background:
    radial-gradient(circle at 10% 0%, rgba(14, 165, 233, 0.08), transparent 30%),
    radial-gradient(circle at 88% 18%, rgba(236, 72, 153, 0.07), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88));
  box-shadow: var(--shadow-colorful);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

:global(body.dark-mode) .dashboard-hero {
  border-color: rgba(148, 163, 184, 0.22);
  background:
    radial-gradient(circle at 10% 0%, rgba(14, 165, 233, 0.08), transparent 30%),
    radial-gradient(circle at 88% 18%, rgba(236, 72, 153, 0.07), transparent 28%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.78));
}

.dashboard-hero::before {
  content: "";
  position: absolute;
  inset: -120px -80px auto auto;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.08), transparent 65%);
  animation: none;
}

.hero__copy {
  position: relative;
  z-index: 1;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: var(--color-primary-text);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow: var(--shadow-control);
}

:global(body.dark-mode) .hero__eyebrow {
  background: rgba(15, 23, 42, 0.72);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero__scope {
  display: inline-flex;
  margin: 18px 0 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--color-info-bg-subtle);
  color: var(--color-info-text);
  font-size: 12px;
  font-weight: 700;
}

.hero__visual {
  position: relative;
  min-height: 230px;
}

.mail-orbit {
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(99, 102, 241, 0.18);
  animation: rotateSoft 12s linear infinite;
}

.mail-orbit--one {
  inset: 14px 44px 34px 22px;
}

.mail-orbit--two {
  inset: 44px 4px 14px 64px;
  border-color: rgba(236, 72, 153, 0.2);
  animation-duration: 15s;
  animation-direction: reverse;
}

.mail-card {
  position: absolute;
  right: 22px;
  top: 28px;
  width: min(270px, 100%);
  padding: 18px;
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.62)),
    var(--gradient-brand);
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow: 0 16px 38px rgba(37, 99, 235, 0.14);
  animation: cardFloat 4.8s ease-in-out infinite;
}

:global(body.dark-mode) .mail-card {
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.72)),
    var(--gradient-brand);
  border-color: rgba(148, 163, 184, 0.22);
}

.mail-card__top {
  display: flex;
  gap: 7px;
  margin-bottom: 18px;
}

.mail-card__top span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--color-primary);
}

.mail-card__top span:nth-child(2) {
  background: var(--color-brand-pink);
}

.mail-card__top span:nth-child(3) {
  background: var(--color-success);
}

.mail-card__envelope {
  position: relative;
  height: 110px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(236, 72, 153, 0.16)),
    rgba(255, 255, 255, 0.74);
  overflow: hidden;
}

:global(body.dark-mode) .mail-card__envelope {
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(236, 72, 153, 0.14)),
    rgba(2, 6, 23, 0.42);
}

.envelope__flap {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.26), rgba(14, 165, 233, 0.2));
}

.envelope__line {
  position: absolute;
  left: 22px;
  right: 22px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.envelope__line--one {
  bottom: 32px;
}

.envelope__line--two {
  right: 74px;
  bottom: 18px;
}

.mail-card__route {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.route-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--color-info-soft);
  box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.12);
}

.route-dot--hot {
  background: var(--color-brand-pink);
  box-shadow: 0 0 0 6px rgba(236, 72, 153, 0.12);
}

.route-dot--ok {
  background: var(--color-success);
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.route-line {
  flex: 1;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-info-soft), var(--color-brand-pink), var(--color-success));
  background-size: 200% 100%;
  animation: routeFlow 2.6s linear infinite;
}

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
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-text-main);
  min-height: 150px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.card--stat:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px var(--shadow-card-strong-color);
}

.card__shine,
.card__spark {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
}

.card__shine {
  right: -38px;
  top: -54px;
  width: 130px;
  height: 130px;
  opacity: 0.24;
  filter: blur(0);
}

.page-subtitle--muted {
  margin-top: 6px;
  font-size: 13px;
}

.card--blue {
  border-top: 4px solid var(--color-info-soft);
}

.card--blue .card__shine {
  background: radial-gradient(circle, rgba(14, 165, 233, 0.12), transparent 66%);
}

.card--green {
  border-top: 4px solid var(--color-success);
}

.card--green .card__shine {
  background: radial-gradient(circle, rgba(34, 197, 94, 0.12), transparent 66%);
}

.card--indigo {
  border-top: 4px solid var(--color-primary-soft);
}

.card--indigo .card__shine {
  background: radial-gradient(circle, rgba(124, 58, 237, 0.12), transparent 66%);
}

.card--yellow {
  border-top: 4px solid var(--color-warning-soft);
}

.card--yellow .card__shine {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.12), transparent 66%);
}

.card__icon {
  width: max-content;
  min-width: 54px;
  height: 34px;
  padding: 0 10px;
  border-radius: 999px;
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
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 0;
}

.card--action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  min-height: 150px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  text-decoration: none;
  color: inherit;
}

.card--action:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px var(--shadow-card-strong-color);
  border-color: var(--color-primary-border-muted);
}

.card--action:hover .card__spark {
  transform: scale(1.06);
  opacity: 0.32;
}

.card__spark {
  right: -24px;
  bottom: -28px;
  width: 92px;
  height: 92px;
  opacity: 0.18;
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.card__spark--purple {
  background: radial-gradient(circle, rgba(124, 58, 237, 0.14), transparent 68%);
}

.card__spark--blue {
  background: radial-gradient(circle, rgba(14, 165, 233, 0.14), transparent 68%);
}

.card__spark--teal {
  background: radial-gradient(circle, rgba(20, 184, 166, 0.14), transparent 68%);
}

.card__spark--green {
  background: radial-gradient(circle, rgba(34, 197, 94, 0.14), transparent 68%);
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
  color: var(--color-text-strong);
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
  padding: 10px 8px;
  border-radius: 12px;
  transition:
    background 0.18s ease,
    transform 0.18s ease;
}

.activity-item:hover {
  background: var(--color-primary-bg-subtle);
  transform: translateX(3px);
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
  height: 8px;
  border-radius: 999px;
  background: var(--color-border-subtle);
  position: relative;
  overflow: hidden;
}

.performance__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  min-width: 4px;
  animation: growBar 0.8s ease both;
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
  .dashboard-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero__visual {
    min-height: 190px;
  }

  .mail-card {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .grid--stats,
  .grid--actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid--bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    padding: 20px;
    border-radius: 18px;
  }

  .hero__actions .btn {
    width: 100%;
  }

  .hero__scope {
    border-radius: 14px;
    line-height: 1.45;
  }

  .hero__visual {
    min-height: 160px;
  }

  .mail-card {
    width: min(240px, 100%);
    top: 10px;
  }

  .grid--stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .grid--actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .card--stat {
    min-height: 126px;
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

@keyframes cardFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 1024px) {
  @keyframes cardFloat {
    0%,
    100% {
      transform: translateX(-50%) translateY(0);
    }

    50% {
      transform: translateX(-50%) translateY(-8px);
    }
  }
}

@keyframes routeFlow {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 200% 0;
  }
}

@keyframes rotateSoft {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes heroGlow {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-24px, 18px, 0) scale(1.08);
  }
}

@keyframes growBar {
  from {
    transform: scaleX(0.1);
    transform-origin: left;
  }

  to {
    transform: scaleX(1);
    transform-origin: left;
  }
}
</style>
