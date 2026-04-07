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
        Start Campaign
      </button>
      <button type="button" class="btn btn--secondary" @click="pauseCampaign">
        Pause Campaign
      </button>
    </div>
  </section>

  <section class="grid grid--detail" v-if="campaign">
    <article class="card panel">
      <h2 class="section-title">Overview</h2>
      <p class="metric"><strong>Status</strong>: {{ campaign.status }}</p>
      <p class="metric"><strong>Template</strong>: {{ campaign.templateName }}</p>
      <p class="metric"><strong>Sender</strong>: {{ campaign.sender }}</p>
      <p class="metric"><strong>Audience</strong>: {{ campaign.audience }}</p>
      <p class="metric">
        <strong>Updated</strong>: {{ mockWorkspace.formatRelativeTime(campaign.updatedAt) }}
      </p>
    </article>

    <article class="card panel">
      <h2 class="section-title">Actions</h2>
      <div class="stack">
        <button type="button" class="btn btn--secondary" @click="refreshState">
          Refresh Mock State
        </button>
        <RouterLink
          :to="`/campaigns/${route.params.id}/recipients`"
          class="btn btn--secondary"
        >
          View Recipients
        </RouterLink>
      </div>
    </article>
  </section>

  <section v-else class="content__section">
    <div class="card panel">
      <p class="metric">Campaign not found in mock workspace.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const route = useRoute();
const notice = useNotice();
const campaign = computed(() =>
  mockWorkspace.getCampaignById(String(route.params.id)),
);

function startCampaign() {
  const updated = mockWorkspace.startCampaign(String(route.params.id));
  if (!updated) {
    notice.show("Campaign not found.", "error");
    return;
  }
  notice.show(`"${updated.name}" is now sending.`, "success");
}

function pauseCampaign() {
  const updated = mockWorkspace.pauseCampaign(String(route.params.id));
  if (!updated) {
    notice.show("Campaign not found.", "error");
    return;
  }
  notice.show(`"${updated.name}" is paused.`, "info");
}

function refreshState() {
  if (!campaign.value) {
    notice.show("Campaign not found.", "error");
    return;
  }
  notice.show(
    `Campaign is ${campaign.value.status} with ${campaign.value.recipients} recipients.`,
    "info",
  );
}
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.grid--detail {
  grid-template-columns: 1.7fr 1fr;
}

.panel {
  border: 1px solid var(--color-border-subtle);
}

.metric {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--color-text-main);
}

.actions,
.stack {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stack .btn {
  text-decoration: none;
}

@media (max-width: 900px) {
  .grid--detail {
    grid-template-columns: 1fr;
  }
}
</style>
