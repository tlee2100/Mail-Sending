<template>
  <div class="empty-state">
    <div class="empty-state__icon" aria-hidden="true">
      <slot name="icon">{{ icon || "✉" }}</slot>
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: string;
  }>(),
  {
    description: "",
    icon: "✉",
  },
);
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: var(--gradient-panel, #ffffff);
  border: 1px dashed var(--color-border-subtle, #cbd5e1);
  border-radius: var(--radius-card, 16px);
  margin: 16px 0;
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--color-primary, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
}

.empty-state__title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-strong, #0f172a);
}

.empty-state__desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--color-text-muted, #64748b);
  max-width: 440px;
  line-height: 1.5;
}

.empty-state__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
