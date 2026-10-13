<template>
  <BaseModal
    :model-value="modelValue"
    :title="templateName ? `Preview: ${templateName}` : 'Email Preview'"
    subtitle="Simulate how your email looks in desktop and mobile inboxes"
    eyebrow="Live Preview"
    max-width="840px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="preview-toolbar">
      <div class="device-switch">
        <button
          type="button"
          class="device-btn"
          :class="{ 'device-btn--active': device === 'desktop' }"
          @click="device = 'desktop'"
        >
          Desktop (600px)
        </button>
        <button
          type="button"
          class="device-btn"
          :class="{ 'device-btn--active': device === 'mobile' }"
          @click="device = 'mobile'"
        >
          Mobile (375px)
        </button>
      </div>
    </div>

    <div class="preview-stage">
      <div
        class="preview-frame-wrapper"
        :style="{ maxWidth: device === 'mobile' ? '375px' : '640px' }"
      >
        <iframe
          class="preview-iframe"
          :srcdoc="htmlContent"
          sandbox="allow-same-origin"
          title="Email Preview"
        ></iframe>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn--secondary" @click="$emit('update:modelValue', false)">
        Close
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseModal from "../common/BaseModal.vue";

defineProps<{
  modelValue: boolean;
  htmlContent: string;
  templateName?: string;
}>();

defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const device = ref<"desktop" | "mobile">("desktop");
</script>

<style scoped>
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.device-switch {
  display: flex;
  background: var(--color-bg-surface, #f1f5f9);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle, #e2e8f0);
}

.device-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
}

.device-btn--active {
  background: #ffffff;
  color: var(--color-primary, #2563eb);
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.preview-stage {
  display: flex;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid var(--color-border-subtle, #e2e8f0);
  border-radius: 12px;
  padding: 24px;
  min-height: 480px;
}

.preview-frame-wrapper {
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: max-width 0.25s ease;
}

.preview-iframe {
  width: 100%;
  height: 480px;
  border: none;
  display: block;
}
</style>
