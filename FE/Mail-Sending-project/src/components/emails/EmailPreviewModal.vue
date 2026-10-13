<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card modal-card--preview">
      <header class="modal-head">
        <div>
          <p class="modal-kicker">Email Preview</p>
          <h2 class="modal-title">{{ subject || "Untitled Email" }}</h2>
          <p class="modal-subtitle">Sender: {{ senderEmail || "No sender chosen" }}</p>
        </div>
        <div class="head-actions">
          <div class="device-toggle">
            <button
              type="button"
              class="device-btn"
              :class="{ 'device-btn--active': viewMode === 'desktop' }"
              @click="viewMode = 'desktop'"
            >
              Desktop
            </button>
            <button
              type="button"
              class="device-btn"
              :class="{ 'device-btn--active': viewMode === 'mobile' }"
              @click="viewMode = 'mobile'"
            >
              Mobile
            </button>
          </div>
          <button type="button" class="modal-close" @click="emit('close')">×</button>
        </div>
      </header>

      <div class="preview-stage" :class="`preview-stage--${viewMode}`">
        <div class="email-envelope">
          <div class="envelope-header">
            <div><strong>Subject:</strong> {{ subject }}</div>
            <div><strong>From:</strong> {{ senderEmail }}</div>
          </div>
          <div class="envelope-body" v-html="htmlContent"></div>
        </div>
      </div>

      <footer class="modal-actions preview-footer">
        <div class="quick-test-send">
          <input
            v-model.trim="testEmail"
            type="email"
            placeholder="Send test to: you@example.com"
            class="test-email-input"
          />
          <button
            type="button"
            class="btn btn--secondary"
            :disabled="!testEmail || isSendingTest"
            @click="handleSendTest"
          >
            {{ isSendingTest ? "Sending..." : "Send Test" }}
          </button>
        </div>
        <button type="button" class="btn btn--secondary" @click="emit('close')">Close</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  isOpen: boolean;
  subject: string;
  senderEmail: string;
  htmlContent: string;
  isSendingTest?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "send-test", email: string): void;
}>();

const viewMode = ref<"desktop" | "mobile">("desktop");
const testEmail = ref("");

function handleSendTest() {
  if (testEmail.value) {
    emit("send-test", testEmail.value);
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card--preview {
  width: min(900px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.12));
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.modal-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #38bdf8;
  margin: 0 0 4px;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 4px;
}

.modal-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-toggle {
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 2px;
}

.device-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.device-btn--active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.modal-close {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.preview-stage {
  flex: 1;
  min-height: 350px;
  max-height: 520px;
  overflow-y: auto;
  background: #0b1120;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;
}

.email-envelope {
  background: #ffffff;
  color: #0f172a;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
}

.preview-stage--mobile .email-envelope {
  max-width: 375px;
}

.envelope-header {
  padding: 12px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.envelope-body {
  padding: 20px;
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.quick-test-send {
  display: flex;
  gap: 8px;
}

.test-email-input {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 12px;
  width: 240px;
}
</style>
