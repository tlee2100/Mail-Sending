<template>
  <section class="content__header">
    <h1 class="page-title">Campaign Recipients</h1>
    <p class="page-subtitle">
      Campaign ID: {{ route.params.id }} - recipient snapshots and delivery state.
    </p>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table" v-if="rows.length">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Status</th>
            <th>Last Event</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.email">
            <td>{{ row.email }}</td>
            <td>{{ row.name }}</td>
            <td>
              <span class="status" :class="`status--${row.status}`">{{ row.status }}</span>
            </td>
            <td>{{ row.lastEvent }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-text">No recipients recorded for this campaign yet.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { mockWorkspace } from "../stores/mockWorkspace";

const route = useRoute();
const rows = computed(
  () => mockWorkspace.getCampaignById(String(route.params.id))?.recipientRows || [],
);
</script>

<style scoped>
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
  color: var(--color-text-main);
}

.table th {
  color: var(--color-text-muted);
  font-weight: 600;
}

.status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-control-bg-muted);
  text-transform: capitalize;
}

.status--opened {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.status--delivered {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.status--paused {
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
}

.empty-text {
  padding: 18px;
  color: var(--color-text-muted);
}
</style>
