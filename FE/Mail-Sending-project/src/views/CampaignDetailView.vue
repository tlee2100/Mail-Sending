<template>
  <section class="content__header header-row">
    <div>
      <h1 class="page-title">Campaign Detail</h1>
      <p class="page-subtitle">Campaign ID: {{ route.params.id }}</p>
    </div>
    <div class="actions">
      <button type="button" class="btn btn--primary">
        POST /campaigns/:id/start
      </button>
      <button type="button" class="btn btn--secondary">
        POST /campaigns/:id/pause
      </button>
    </div>
  </section>

  <section class="grid grid--detail">
    <article class="card panel">
      <h2 class="section-title">Overview</h2>
      <p class="metric"><strong>Status</strong>: draft</p>
      <p class="metric"><strong>Template</strong>: Product Reveal v3</p>
      <p class="metric"><strong>Sender</strong>: marketing@company.com</p>
      <p class="metric"><strong>Audience</strong>: 1,250 contacts</p>
    </article>

    <article class="card panel">
      <h2 class="section-title">Actions</h2>
      <div class="stack">
        <button type="button" class="btn btn--secondary">
          GET /campaigns/:id
        </button>
        <RouterLink
          :to="`/campaigns/${route.params.id}/recipients`"
          class="btn btn--secondary"
          >GET /campaigns/:id/recipients</RouterLink
        >
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();
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
