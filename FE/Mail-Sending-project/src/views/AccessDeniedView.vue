<template>
  <section class="access-panel">
    <div class="access-code">403</div>
    <h1 class="page-title">Access denied</h1>
    <p class="page-subtitle">
      Your current role does not have permission to open this screen.
    </p>
    <div class="access-actions">
      <RouterLink to="/" class="btn btn--primary">Back to Dashboard</RouterLink>
      <RouterLink to="/profile" class="btn btn--secondary">View Profile</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<style scoped>
.access-panel {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 60vh;
  padding: 44px 20px;
  text-align: center;
}

.access-code {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 18px;
  background: var(--color-danger-bg-subtle);
  color: var(--color-danger-text);
  font-size: 28px;
  font-weight: 800;
}

.access-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
</style>
