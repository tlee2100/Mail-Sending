<template>
  <section class="content__header">
    <h1 class="page-title">Campaign Recipients</h1>
    <p class="page-subtitle">
      Campaign ID: {{ route.params.id }} - Sent content and live tracking activity
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table" v-if="rows.length">
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Subject</th>
            <th>Sent Time</th>
            <th>Opens</th>
            <th>Clicks</th>
            <th>Last Tracking</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.email }}</td>
            <td>{{ row.status }}</td>
            <td>{{ row.rendered_subject || "-" }}</td>
            <td>{{ row.sent_time ? new Date(row.sent_time).toLocaleString() : "-" }}</td>
            <td>{{ row.open_count || 0 }}</td>
            <td>{{ row.click_count || 0 }}</td>
            <td>{{ lastTrackedEvent(row) }}</td>
            <td>
              <button type="button" class="link-action" @click="selectRecipient(row.id)">
                View email
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-text">No recipients found for this campaign.</p>
    </div>
  </section>

  <section v-if="selectedRecipient" class="message-detail">
    <article class="card message-card">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Sent Email</p>
          <h2>{{ selectedRecipient.rendered_subject || "(No subject)" }}</h2>
          <p class="meta">
            To: {{ selectedRecipient.email }} - Sent:
            {{ formatDate(selectedRecipient.sent_time) }}
          </p>
        </div>
        <button type="button" class="btn btn--secondary" @click="closeDetail">
          Close
        </button>
      </div>
      <p class="preview-note">
        Preview is read-only. Tracking links and the open pixel are disabled here so this view
        does not count as recipient engagement.
      </p>
      <iframe
        class="email-preview"
        :srcdoc="previewHtml"
        sandbox=""
        tabindex="-1"
        title="Sent email preview"
      ></iframe>
    </article>

    <article class="card tracking-card">
      <div class="panel-title">
        <div>
          <p class="eyebrow">Live Tracking</p>
          <h2>Recipient Activity</h2>
        </div>
        <button type="button" class="btn btn--secondary" @click="refreshDetail">
          Refresh
        </button>
      </div>
      <div class="tracking-metrics">
        <div><strong>{{ selectedRecipient.open_count || 0 }}</strong><span>Opens</span></div>
        <div><strong>{{ selectedRecipient.click_count || 0 }}</strong><span>Clicks</span></div>
        <div><strong>{{ selectedRecipient.status }}</strong><span>Status</span></div>
      </div>
      <div v-if="trackingEvents.length" class="timeline">
        <div v-for="event in trackingEvents" :key="event.id" class="timeline-row">
          <div>
            <strong>{{ formatEvent(event.event_type) }}</strong>
            <a
              v-if="event.clicked_url"
              :href="event.clicked_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ event.clicked_url }}
            </a>
          </div>
          <span>{{ formatDate(event.event_time) }}</span>
        </div>
      </div>
      <p v-else class="empty-text">No tracking activity recorded for this recipient yet.</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { campaignsApi } from "../api/campaignsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const route = useRoute();
const notice = useNotice();
const rows = ref<Array<Record<string, any>>>([]);
const selectedRecipient = ref<Record<string, any> | null>(null);
let pollingTimer: number | undefined;

const trackingEvents = computed(
  () => (selectedRecipient.value?.trackingEvents || []) as Array<Record<string, any>>,
);

const previewHtml = computed(() => {
  const html = String(selectedRecipient.value?.rendered_html || "");
  if (!html) {
    return "<p style='font:14px Arial,sans-serif;color:#667085;padding:24px'>No rendered HTML was stored for this email.</p>";
  }
  return html.replace(
    /<img\b(?=[^>]*\/api\/v1\/tracking\/open\/)[^>]*>/gi,
    "",
  );
});

function lastTrackedEvent(row: Record<string, any>) {
  const events = [
    row.open_time ? { label: "Opened", time: row.open_time } : null,
    row.click_time ? { label: "Clicked", time: row.click_time } : null,
  ].filter(Boolean) as Array<{ label: string; time: string }>;
  if (!events.length) return "-";
  const latest = events.sort(
    (left, right) => new Date(right.time).getTime() - new Date(left.time).getTime(),
  )[0]!;
  return `${latest.label} ${new Date(latest.time).toLocaleString()}`;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatEvent(eventType?: string) {
  const value = String(eventType || "");
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Event";
}

async function loadRecipients(silent = false) {
  if (!auth.state.token) return;
  try {
    const response = await campaignsApi.recipients(
      auth.state.token,
      String(route.params.id),
    );
    rows.value = response.data.items;
  } catch (error) {
    if (silent) return;
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load recipients";
    notice.show(message, "error");
  }
}

async function loadRecipientDetail(recipientId: string | number, silent = false) {
  if (!auth.state.token) return;
  try {
    const response = await campaignsApi.recipientDetail(
      auth.state.token,
      String(route.params.id),
      recipientId,
    );
    selectedRecipient.value = response.data;
  } catch (error) {
    if (silent) return;
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load sent email detail";
    notice.show(message, "error");
  }
}

function selectRecipient(recipientId: string | number) {
  void loadRecipientDetail(recipientId);
}

function refreshDetail() {
  if (!selectedRecipient.value) return;
  void loadRecipientDetail(selectedRecipient.value.id);
}

function closeDetail() {
  selectedRecipient.value = null;
}

onMounted(() => {
  void loadRecipients();
  pollingTimer = window.setInterval(() => {
    void loadRecipients(true);
    if (selectedRecipient.value) {
      void loadRecipientDetail(selectedRecipient.value.id, true);
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollingTimer !== undefined) {
    window.clearInterval(pollingTimer);
  }
});
</script>

<style scoped>
.card--table { border: 1px solid var(--color-border-subtle); }
.table { width: 100%; border-collapse: collapse; }
.table th,
.table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  font-size: 13px;
  color: var(--color-text-main);
}
.table th { color: var(--color-text-muted); font-weight: 600; }
.empty-text { padding: 18px; color: var(--color-text-muted); }
.link-action {
  border: 0;
  background: transparent;
  color: var(--color-accent-primary);
  cursor: pointer;
  font-weight: 700;
}
.message-detail {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
  gap: 18px;
  margin-top: 20px;
}
.message-card,
.tracking-card { border: 1px solid var(--color-border-subtle); }
.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.panel-title h2 { margin: 4px 0 6px; color: var(--color-text-main); }
.eyebrow {
  margin: 0;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.meta,
.preview-note { color: var(--color-text-muted); font-size: 13px; }
.email-preview {
  width: 100%;
  min-height: 520px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: white;
  pointer-events: none;
}
.tracking-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}
.tracking-metrics div {
  padding: 12px 8px;
  border-radius: 12px;
  background: var(--color-bg-surface-soft);
  text-align: center;
}
.tracking-metrics strong { display: block; color: var(--color-text-main); font-size: 20px; }
.tracking-metrics span { color: var(--color-text-muted); font-size: 12px; }
.timeline { display: grid; gap: 12px; }
.timeline-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 12px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.timeline-row strong { display: block; color: var(--color-text-main); }
.timeline-row a {
  display: block;
  overflow-wrap: anywhere;
  color: var(--color-accent-primary);
}
@media (max-width: 1050px) {
  .message-detail { grid-template-columns: 1fr; }
}
</style>
