<template>
  <section class="content__header">
    <h1 class="page-title">Contact Field Values</h1>
    <p class="page-subtitle">
      Contact ID: {{ route.params.id }} - Update per-contact field values.
    </p>
  </section>

  <section class="content__section">
    <div class="card form-card">
      <div class="input-wrap" v-for="field in fields" :key="field.key">
        <label :for="field.key">{{ field.label }}</label>
        <input
          :id="field.key"
          v-model="field.value"
          type="text"
          :placeholder="field.placeholder"
        />
      </div>

      <div class="actions">
        <button type="button" class="btn btn--secondary">
          Load from GET /contacts/:id/fields
        </button>
        <button type="button" class="btn btn--primary">
          Save to PUT /contacts/:id/fields
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const fields = reactive([
  { key: "company", label: "Company", value: "", placeholder: "Acme Inc." },
  { key: "plan", label: "Plan", value: "", placeholder: "Enterprise" },
  { key: "timezone", label: "Timezone", value: "", placeholder: "UTC+7" },
]);
</script>

<style scoped>
.form-card {
  border: 1px solid var(--color-border-subtle);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
