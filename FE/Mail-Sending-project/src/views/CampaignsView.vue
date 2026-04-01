<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Campaigns</h1>
      <p class="page-subtitle">
        Create, monitor and control campaign delivery lifecycle.
      </p>
    </div>
    <button type="button" class="btn btn--primary">+ New Campaign</button>
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
              <span class="badge">{{ item.status }}</span>
            </td>
            <td>{{ item.recipients }}</td>
            <td>{{ item.updatedAt }}</td>
            <td class="actions">
              <RouterLink
                :to="`/campaigns/${item.id}`"
                class="btn btn--secondary btn--small"
                >Detail</RouterLink
              >
              <RouterLink
                :to="`/campaigns/${item.id}/recipients`"
                class="btn btn--secondary btn--small"
                >Recipients</RouterLink
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";

const campaigns = [
  {
    id: "c_101",
    name: "Q2 Product Launch",
    status: "draft",
    recipients: 1250,
    updatedAt: "35m ago",
  },
  {
    id: "c_102",
    name: "Weekly Newsletter",
    status: "running",
    recipients: 8400,
    updatedAt: "5m ago",
  },
];
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
