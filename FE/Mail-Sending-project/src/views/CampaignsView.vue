<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Campaigns</h1>
      <p class="page-subtitle">
        Create, monitor and control campaign delivery lifecycle.
      </p>
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
      <table class="table">
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
            <td>{{ item.name }}</td>
            <td>
              <span class="badge" :class="`badge--${item.status}`">{{ item.status }}</span>
            </td>
            <td>{{ item.recipients }}</td>
            <td>{{ mockWorkspace.formatRelativeTime(item.updatedAt) }}</td>
            <td class="actions">
              <RouterLink
                :to="`/campaigns/${item.id}`"
                class="btn btn--secondary btn--small"
              >
                Detail
              </RouterLink>
              <RouterLink
                :to="`/campaigns/${item.id}/recipients`"
                class="btn btn--secondary btn--small"
              >
                Recipients
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const campaigns = computed(() => mockWorkspace.state.campaigns);

function createCampaign() {
  const name = window.prompt("Campaign name", "Spring Launch");
  if (!name?.trim()) return;
  const campaign = mockWorkspace.addCampaign({ name: name.trim() });
  notice.show(`Created "${campaign.name}" in draft mode.`, "success");
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
  text-transform: capitalize;
}

.badge--running {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.badge--paused {
  background: rgba(245, 158, 11, 0.14);
  color: #92400e;
}

.badge--sent {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn--small {
  padding: 6px 10px;
  font-size: 12px;
  text-decoration: none;
}
</style>
