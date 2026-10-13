<template>
  <article class="stat-card" :class="`stat-card--${color || 'blue'}`">
    <div class="stat-card__shine" aria-hidden="true"></div>
    <div v-if="icon" class="stat-card__icon">{{ icon }}</div>
    <span class="stat-card__label">{{ label }}</span>
    <strong class="stat-card__value">{{ value }}</strong>
    <small v-if="subtext" class="stat-card__subtext">{{ subtext }}</small>
  </article>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    subtext?: string;
    color?: "blue" | "green" | "indigo" | "yellow" | "purple" | "red";
    icon?: string;
  }>(),
  {
    color: "blue",
    subtext: "",
    icon: "",
  },
);
</script>

<style scoped>
.stat-card {
  position: relative;
  background: var(--gradient-panel, #ffffff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);
  border-radius: var(--radius-card, 16px);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  box-shadow: var(--shadow-glass, 0 4px 16px rgba(0, 0, 0, 0.04));
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08);
}

.stat-card__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
}

.stat-card__value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-text-strong, #0f172a);
}

.stat-card__subtext {
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
  margin-top: 2px;
}

.stat-card--blue {
  border-top: 3px solid #2563eb;
}
.stat-card--green {
  border-top: 3px solid #16a34a;
}
.stat-card--indigo {
  border-top: 3px solid #6366f1;
}
.stat-card--yellow {
  border-top: 3px solid #eab308;
}
.stat-card--purple {
  border-top: 3px solid #9333ea;
}
.stat-card--red {
  border-top: 3px solid #ef4444;
}
</style>
