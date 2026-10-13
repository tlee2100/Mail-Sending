<template>
  <div class="table-skeleton" aria-busy="true" aria-label="Loading content">
    <div v-for="r in rows || 5" :key="r" class="skeleton-row">
      <div
        v-for="c in columns || 4"
        :key="c"
        class="skeleton-cell"
        :style="{
          width: c === 1 ? '35%' : c === 2 ? '25%' : c === 3 ? '20%' : '15%',
        }"
      >
        <span class="skeleton-shimmer"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number;
    columns?: number;
  }>(),
  {
    rows: 5,
    columns: 4,
  },
);
</script>

<style scoped>
.table-skeleton {
  background: var(--gradient-panel, #ffffff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);
  border-radius: var(--radius-card, 16px);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle, #f1f5f9);
}

.skeleton-row:last-child {
  border-bottom: none;
}

.skeleton-cell {
  height: 18px;
  background: #e2e8f0;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
