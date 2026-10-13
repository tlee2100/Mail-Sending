<template>
  <div v-if="totalPages > 1 || total > 0" class="pagination">
    <div class="pagination__info">
      <span>
        Showing
        <strong>{{ fromIndex }}</strong>
        to
        <strong>{{ toIndex }}</strong>
        of
        <strong>{{ total }}</strong>
      </span>
    </div>

    <div class="pagination__controls">
      <button
        type="button"
        class="pagination__btn"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        Previous
      </button>

      <span class="pagination__current">Page {{ page }} of {{ totalPages || 1 }}</span>

      <button
        type="button"
        class="pagination__btn"
        :disabled="page >= totalPages"
        @click="goToPage(page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    page: number;
    pageSize?: number;
    total: number;
    totalPages: number;
  }>(),
  {
    pageSize: 20,
  },
);

const emit = defineEmits<{
  (e: "change", page: number): void;
}>();

const fromIndex = computed(() => {
  if (props.total === 0) return 0;
  return (props.page - 1) * props.pageSize + 1;
});

const toIndex = computed(() => {
  const calculated = props.page * props.pageSize;
  return Math.min(calculated, props.total);
});

function goToPage(targetPage: number) {
  if (targetPage >= 1 && targetPage <= props.totalPages && targetPage !== props.page) {
    emit("change", targetPage);
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border-subtle, #e2e8f0);
  background: rgba(248, 250, 252, 0.4);
}

.pagination__info {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}

.pagination__info strong {
  color: var(--color-text-strong, #0f172a);
}

.pagination__controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination__btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle, #cbd5e1);
  background: var(--color-bg-panel, #ffffff);
  color: var(--color-text-main, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pagination__btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.pagination__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination__current {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}
</style>
