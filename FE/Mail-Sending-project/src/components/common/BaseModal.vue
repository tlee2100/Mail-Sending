<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop"
      @click.self="handleClose"
      @keydown.esc="handleClose"
    >
      <div class="modal-card" :style="{ maxWidth: maxWidth || '640px' }">
        <header class="modal-header">
          <slot name="header">
            <div>
              <p v-if="eyebrow" class="modal-eyebrow">{{ eyebrow }}</p>
              <h2 class="modal-title">{{ title }}</h2>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="modal-close" aria-label="Close modal" @click="handleClose">
              ×
            </button>
          </slot>
        </header>

        <div class="modal-body">
          <slot></slot>
        </div>

        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    maxWidth?: string;
  }>(),
  {
    title: "",
    subtitle: "",
    eyebrow: "",
    maxWidth: "640px",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

function handleClose() {
  emit("update:modelValue", false);
  emit("close");
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.modelValue) {
    handleClose();
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
  },
);

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
  animation: fadeIn 0.18s ease-out;
}

.modal-card {
  width: 100%;
  background: var(--color-bg-panel, #ffffff);
  border: 1px solid var(--color-border-subtle, #e2e8f0);
  border-radius: var(--radius-card, 16px);
  box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 40px);
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border-subtle, #e2e8f0);
}

.modal-eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary, #2563eb);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-strong, #0f172a);
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.modal-close:hover {
  background: rgba(15, 23, 42, 0.06);
  color: var(--color-text-strong, #0f172a);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle, #e2e8f0);
  background: rgba(248, 250, 252, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
