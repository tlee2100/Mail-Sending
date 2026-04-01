<template>
  <section class="content__header">
    <h1 class="page-title">Campaign Recipients</h1>
    <p class="page-subtitle">
      Campaign ID: {{ route.params.id }} - recipient snapshots and delivery
      state.
    </p>
  </section>

  <section class="content__section">
    <div class="card card--table">
      <table class="table">
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
              <span class="status">{{ row.status }}</span>
            </td>
            <td>{{ row.lastEvent }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();

const rows = [
  {
    email: "maria@acme.io",
    name: "Maria",
    status: "queued",
    lastEvent: "Queued 1m ago",
  },
  {
    email: "daniel@acme.io",
    name: "Daniel",
    status: "delivered",
    lastEvent: "Delivered 8m ago",
  },
  {
    email: "sarah@acme.io",
    name: "Sarah",
    status: "opened",
    lastEvent: "Opened 2m ago",
  },
];
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
}
</style>
