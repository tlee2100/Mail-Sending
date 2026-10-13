<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <form class="modal-card modal-card--wide" @submit.prevent="handleSave">
      <header class="modal-head">
        <div>
          <p class="modal-kicker">{{ isEdit ? "Edit contact" : "New contact" }}</p>
          <h2 class="modal-title">{{ isEdit ? "Update contact" : "Add contact" }}</h2>
          <p class="modal-subtitle">Manage recipient profile data used for merge tags.</p>
        </div>
        <button type="button" class="modal-close" @click="emit('close')">×</button>
      </header>

      <div class="contact-form-grid">
        <label class="field field--wide">
          <span>Email *</span>
          <input
            v-model.trim="form.email"
            type="email"
            required
            placeholder="customer@example.com"
          />
        </label>
        <label class="field">
          <span>First name</span>
          <input v-model.trim="form.firstName" type="text" placeholder="Tan" />
        </label>
        <label class="field">
          <span>Last name</span>
          <input v-model.trim="form.lastName" type="text" placeholder="Le" />
        </label>
        <label class="field">
          <span>Phone</span>
          <input v-model.trim="form.phone" type="text" placeholder="090..." />
        </label>
        <label class="field">
          <span>Company</span>
          <input v-model.trim="form.company" type="text" placeholder="ChadMailer" />
        </label>
        <label class="field">
          <span>City</span>
          <input v-model.trim="form.city" type="text" placeholder="Ho Chi Minh" />
        </label>
        <label class="field">
          <span>Country</span>
          <input v-model.trim="form.country" type="text" placeholder="Vietnam" />
        </label>
        <label class="field">
          <span>Status</span>
          <select v-model="form.emailStatus">
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label class="field">
          <span>Source</span>
          <input v-model.trim="form.source" type="text" placeholder="manual" />
        </label>
      </div>

      <footer class="modal-actions">
        <button type="button" class="btn btn--secondary" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn btn--primary" :disabled="isSaving">
          {{ isSaving ? "Saving..." : isEdit ? "Save changes" : "Create contact" }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { ContactItem } from "./ContactTable.vue";

const props = defineProps<{
  isOpen: boolean;
  contact?: ContactItem | null;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", payload: typeof form): void;
}>();

const isEdit = computed(() => Boolean(props.contact));

const form = reactive({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  city: "",
  country: "",
  emailStatus: "active",
  source: "manual",
});

watch(
  () => props.contact,
  (c) => {
    if (c) {
      form.email = c.email || "";
      form.firstName = c.first_name || "";
      form.lastName = c.last_name || "";
      form.phone = c.phone || "";
      form.company = c.company || "";
      form.city = c.city || "";
      form.country = c.country || "";
      form.emailStatus = c.email_status || "active";
      form.source = c.source || "manual";
    } else {
      form.email = "";
      form.firstName = "";
      form.lastName = "";
      form.phone = "";
      form.company = "";
      form.city = "";
      form.country = "";
      form.emailStatus = "active";
      form.source = "manual";
    }
  },
  { immediate: true },
);

function handleSave() {
  emit("save", { ...form });
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: min(720px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-bg-card, #1e293b);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.12));
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: var(--color-text-main, #f8fafc);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.modal-kicker {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #38bdf8;
  margin: 0 0 4px;
}

.modal-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 4px;
}

.modal-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--wide {
  grid-column: 1 / -1;
}

.field span {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.field input,
.field select {
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 13px;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
