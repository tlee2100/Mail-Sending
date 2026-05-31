<template>
  <section class="content__header detail-hero" v-if="campaign">
    <div>
      <p class="eyebrow">Campaign Detail</p>
      <h1 class="page-title">{{ campaign.campaign_name }}</h1>
      <p class="page-subtitle">
        ID #{{ route.params.id }} - {{ campaign.template_name || "No template" }} -
        {{ campaign.sender_email || "No sender" }}
      </p>
      <p v-if="isAdmin && ownerText" class="page-subtitle">
        Owner: {{ ownerText }}
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <div class="hero-actions">
      <button
        type="button"
        class="btn btn--primary"
        :disabled="!canManageCampaign"
        @click="startCampaign"
      >
        Start
      </button>
      <button type="button" class="btn btn--secondary" @click="pauseCampaign">
        Pause
      </button>
      <button v-if="isAdmin" type="button" class="btn btn--danger" @click="deleteCampaign">
        Delete
      </button>
    </div>
  </section>

  <section v-if="campaign" class="detail-grid">
    <article class="card hero-card">
      <div class="status-line">
        <span class="badge" :class="`badge--${campaign.status || 'draft'}`">
          {{ campaign.status }}
        </span>
        <span>Updated {{ formatDate(campaign.updated_at || campaign.created_at) }}</span>
      </div>

      <div class="progress-ring">
        <div>
          <strong>{{ sentRate }}%</strong>
          <span>sent</span>
        </div>
      </div>

      <div class="metrics-grid">
        <div>
          <span>Total recipients</span>
          <strong>{{ campaign.total_recipients || 0 }}</strong>
        </div>
        <div>
          <span>Sent</span>
          <strong>{{ campaign.sent_count || 0 }}</strong>
        </div>
        <div>
          <span>Opened</span>
          <strong>{{ campaign.open_count || 0 }}</strong>
        </div>
        <div>
          <span>Clicked</span>
          <strong>{{ campaign.click_count || 0 }}</strong>
        </div>
      </div>
    </article>

    <article class="card panel-card">
      <h2 class="section-title">Campaign Setup</h2>
      <dl class="info-list">
        <div>
          <dt>Template</dt>
          <dd>{{ campaign.template_name || "-" }}</dd>
        </div>
        <div>
          <dt>Sender</dt>
          <dd>{{ campaign.sender_email || "-" }}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{{ campaign.campaign_type || "regular" }}</dd>
        </div>
        <div>
          <dt>Scheduled</dt>
          <dd>{{ formatDate(campaign.scheduled_time) }}</dd>
        </div>
      </dl>
    </article>

    <article class="card panel-card status-card">
      <h2 class="section-title">Recipient Status</h2>
      <div v-for="item in statusBreakdown" :key="item.label" class="status-row">
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.count }}</strong>
        </div>
        <div class="bar">
          <span :style="{ width: `${item.percent}%`, background: item.color }"></span>
        </div>
      </div>
    </article>

    <article class="card panel-card action-card">
      <h2 class="section-title">Actions</h2>
      <p>Refresh live data or inspect every recipient in this campaign.</p>
      <div class="stack">
        <button type="button" class="btn btn--secondary" @click="loadCampaign">
          Refresh
        </button>
        <RouterLink :to="`/campaigns/${route.params.id}/recipients`" class="btn btn--secondary">
          View Recipients
        </RouterLink>
        <RouterLink to="/campaigns" class="btn btn--secondary">
          Back to Campaigns
        </RouterLink>
      </div>
    </article>
  </section>

  <section v-else class="empty-panel">
    <h1 class="page-title">Campaign Detail</h1>
    <p class="page-subtitle">Loading campaign information...</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { adminApi } from "../api/adminApi";
import { campaignsApi } from "../api/campaignsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  canManageOwnRecord,
  recordOwnerLabel,
} from "../utils/recordOwnership";

const route = useRoute();
const router = useRouter();
const notice = useNotice();
const campaign = ref<Record<string, any> | null>(null);

const totalRecipients = computed(() => Number(campaign.value?.total_recipients || 0));
const sentRate = computed(() => {
  if (!totalRecipients.value) return 0;
  return Math.round((Number(campaign.value?.sent_count || 0) / totalRecipients.value) * 100);
});
const isAdmin = computed(() => auth.state.user?.role === "admin");
const canManageCampaign = computed(() =>
  canManageOwnRecord(campaign.value, auth.state.user),
);
const ownerText = computed(() => recordOwnerLabel(campaign.value));

const statusBreakdown = computed(() => {
  const counts = campaign.value?.recipientsByStatus || {};
  const total = Math.max(1, totalRecipients.value);
  return [
    { label: "Pending", key: "pending", color: "var(--color-primary-soft)" },
    { label: "Sent", key: "sent", color: "var(--color-success)" },
    { label: "Failed", key: "failed", color: "var(--color-danger-soft)" },
    { label: "Bounced", key: "bounced", color: "var(--color-orange)" },
  ].map((item) => {
    const count = Number(counts[item.key] || 0);
    return {
      ...item,
      count,
      percent: Math.round((count / total) * 100),
    };
  });
});

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

async function loadCampaign() {
  if (!auth.state.token) return;
  try {
    const response = await campaignsApi.get(auth.state.token, String(route.params.id));
    campaign.value = response.data;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load campaign";
    notice.show(message, "error");
  }
}

async function startCampaign() {
  if (!auth.state.token) return;
  if (!canManageCampaign.value) {
    notice.show("Admin should not start another user's campaign from the normal route.", "error");
    return;
  }
  try {
    await campaignsApi.start(auth.state.token, String(route.params.id));
    notice.show("Campaign started.", "success");
    await loadCampaign();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to start campaign";
    notice.show(message, "error");
  }
}

async function pauseCampaign() {
  if (!auth.state.token) return;
  try {
    if (isAdmin.value && !canManageCampaign.value) {
      await adminApi.pauseCampaign(auth.state.token, String(route.params.id));
    } else {
      await campaignsApi.pause(auth.state.token, String(route.params.id));
    }
    notice.show("Campaign paused.", "success");
    await loadCampaign();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to pause campaign";
    notice.show(message, "error");
  }
}

async function deleteCampaign() {
  if (!auth.state.token || !isAdmin.value) return;
  if (!window.confirm("Delete this campaign?")) return;
  try {
    await adminApi.deleteCampaign(auth.state.token, String(route.params.id));
    notice.show("Campaign deleted.", "success");
    router.push({ name: "campaigns" });
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to delete campaign";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadCampaign();
});
</script>

<style scoped>
.detail-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  padding: 28px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 28px;
  background:
    radial-gradient(circle at 12% 10%, var(--color-primary-glow-strong), var(--color-transparent) 30%),
    linear-gradient(135deg, var(--color-surface-glass-soft), var(--color-info-glass));
  box-shadow: var(--shadow-elevated);
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-actions,
.stack {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.8fr);
  gap: 20px;
  margin-top: 24px;
}

.hero-card,
.panel-card {
  border: 1px solid var(--color-border-subtle);
}

.hero-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 22px;
  align-items: center;
  min-height: 270px;
}

.status-line {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--color-control-bg-muted);
  color: var(--color-text-main);
  font-size: 12px;
  font-weight: 800;
}

.badge--sent { background: var(--color-success-bg); color: var(--color-success-text-strong); }
.badge--sending,
.badge--scheduled { background: var(--color-chip-yellow-bg); color: var(--color-chip-yellow-text); }
.badge--paused { background: var(--color-slate-bg); color: var(--color-text-secondary); }

.progress-ring {
  display: grid;
  place-items: center;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background:
    radial-gradient(circle, var(--color-white) 58%, var(--color-transparent) 59%),
    conic-gradient(var(--color-primary-soft) calc(var(--rate) * 1%), var(--color-slate-bg) 0);
  --rate: v-bind(sentRate);
}

.progress-ring div {
  display: grid;
  place-items: center;
}

.progress-ring strong {
  color: var(--color-text-main);
  font-size: 38px;
}

.progress-ring span {
  color: var(--color-text-muted);
  font-weight: 700;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.metrics-grid div {
  padding: 18px;
  border-radius: 18px;
  background: var(--color-bg-surface-soft);
}

.metrics-grid span,
.info-list dt,
.action-card p {
  color: var(--color-text-muted);
}

.metrics-grid strong {
  display: block;
  margin-top: 8px;
  color: var(--color-text-main);
  font-size: 28px;
}

.info-list {
  display: grid;
  gap: 14px;
  margin: 0;
}

.info-list div {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.info-list div:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.info-list dt {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 700;
}

.info-list dd {
  margin: 0;
  color: var(--color-text-main);
  font-weight: 700;
}

.status-row {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.status-row div:first-child {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-main);
  font-weight: 700;
}

.bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-border-subtle);
}

.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.stack .btn {
  text-decoration: none;
}

.empty-panel {
  padding: 30px;
}

@media (max-width: 960px) {
  .detail-grid,
  .hero-card {
    grid-template-columns: 1fr;
  }

  .progress-ring {
    justify-self: center;
  }
}

@media (max-width: 640px) {
  .detail-hero {
    padding: 20px;
  }

  .hero-actions,
  .hero-actions .btn,
  .stack .btn {
    width: 100%;
    justify-content: center;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
