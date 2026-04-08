<template>
  <section class="content__header">
    <h1 class="page-title">Campaign Recipients</h1>
    <p class="page-subtitle">Campaign ID: {{ route.params.id }}</p>
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.email }}</td>
            <td>{{ row.status }}</td>
            <td>{{ row.rendered_subject || "-" }}</td>
            <td>{{ row.sent_time ? new Date(row.sent_time).toLocaleString() : "-" }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-text">No recipients found for this campaign.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { campaignsApi } from "../api/campaignsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const route = useRoute();
const notice = useNotice();
const rows = ref<Array<Record<string, any>>>([]);

async function loadRecipients() {
  if (!auth.state.token) return;
  try {
    const response = await campaignsApi.recipients(
      auth.state.token,
      String(route.params.id),
    );
    rows.value = response.data.items;
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load recipients";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadRecipients();
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
</style>
