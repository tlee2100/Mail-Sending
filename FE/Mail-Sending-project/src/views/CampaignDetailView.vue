<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Campaign Detail</h1>
      <p class="page-subtitle">Campaign ID: {{ route.params.id }}</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <div class="actions" v-if="campaign">
      <button type="button" class="btn btn--primary" @click="startCampaign">
        Start
      </button>
      <button type="button" class="btn btn--secondary" @click="pauseCampaign">
        Pause
      </button>
    </div>
  </section>

  <section class="grid grid--detail" v-if="campaign">
    <article class="card panel">
      <h2 class="section-title">Overview</h2>
      <p class="metric"><strong>Status</strong>: {{ campaign.status }}</p>
      <p class="metric"><strong>Template</strong>: {{ campaign.template_name || "-" }}</p>
      <p class="metric"><strong>Sender</strong>: {{ campaign.sender_email || "-" }}</p>
      <p class="metric"><strong>Audience</strong>: {{ campaign.total_recipients || 0 }}</p>
    </article>

    <article class="card panel">
      <h2 class="section-title">Actions</h2>
      <div class="stack">
        <button type="button" class="btn btn--secondary" @click="loadCampaign">
          Refresh
        </button>
        <RouterLink :to="`/campaigns/${route.params.id}/recipients`" class="btn btn--secondary">
          View Recipients
        </RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { campaignsApi } from "../api/campaignsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const route = useRoute();
const notice = useNotice();
const campaign = ref<Record<string, any> | null>(null);

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
    await campaignsApi.pause(auth.state.token, String(route.params.id));
    notice.show("Campaign paused.", "success");
    await loadCampaign();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to pause campaign";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadCampaign();
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

.grid--detail { grid-template-columns: 1.7fr 1fr; }
.panel { border: 1px solid var(--color-border-subtle); }
.metric { margin: 0 0 8px; font-size: 14px; color: var(--color-text-main); }
.actions, .stack { display: flex; gap: 10px; flex-wrap: wrap; }
.stack .btn { text-decoration: none; }

@media (max-width: 900px) {
  .grid--detail { grid-template-columns: 1fr; }
}
</style>
