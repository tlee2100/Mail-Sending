<template>
  <section class="contact-picker">
    <div class="contact-picker__head">
      <div>
        <h2 class="contact-picker__title">Recipient Contacts</h2>
        <p class="contact-picker__hint">
          Choose contacts from your saved list. Their email addresses become recipients for
          merge-tag personalization.
        </p>
      </div>
      <span class="contact-picker__count"> {{ selectedContactIds.length }} selected </span>
    </div>

    <div class="contact-picker__controls">
      <input
        v-model="contactSearch"
        type="search"
        placeholder="Search contacts by name, email, company, or city"
        class="contact-picker__search"
      />
      <button type="button" class="btn btn--secondary" @click="selectVisibleContacts">
        Select visible
      </button>
      <button type="button" class="btn btn--secondary" @click="clearSelectedContacts">Clear</button>
      <button type="button" class="btn btn--primary" @click="applySelectedContacts">
        Use selected contacts
      </button>
    </div>

    <div v-if="filteredContacts.length" class="contact-picker__list">
      <label v-for="contact in filteredContacts" :key="String(contact.id)" class="contact-option">
        <input v-model="selectedContactIds" type="checkbox" :value="String(contact.id)" />
        <span class="contact-option__main">
          <strong>{{ contactDisplayName(contact) }}</strong>
          <small>{{ contact.email }}</small>
        </span>
        <span class="contact-option__meta">
          {{ contact.company || contact.city || contact.email_status || "contact" }}
        </span>
      </label>
    </div>
    <div v-else class="contact-picker__empty">
      No contacts found. Add contacts in Email Contacts first.
    </div>

    <div class="input-wrap">
      <label>Recipients *</label>
      <textarea
        :value="modelValue"
        rows="4"
        placeholder="Select contacts above, or paste emails separated by comma, semicolon, or new lines."
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

export type PickerContact = {
  id: number | string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  city?: string | null;
  email_status?: string | null;
  [key: string]: any;
};

const props = defineProps<{
  contacts: PickerContact[];
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const contactSearch = ref("");
const selectedContactIds = ref<string[]>([]);

function contactDisplayName(contact: PickerContact): string {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  return name || contact.email;
}

const filteredContacts = computed(() => {
  const query = contactSearch.value.trim().toLowerCase();
  if (!query) return props.contacts;
  return props.contacts.filter((c) => {
    const haystack = [c.first_name, c.last_name, c.email, c.company, c.city]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
});

function selectVisibleContacts() {
  const visibleIds = filteredContacts.value.map((c) => String(c.id));
  const set = new Set([...selectedContactIds.value, ...visibleIds]);
  selectedContactIds.value = Array.from(set);
}

function clearSelectedContacts() {
  selectedContactIds.value = [];
}

function applySelectedContacts() {
  const selectedEmails = props.contacts
    .filter((c) => selectedContactIds.value.includes(String(c.id)))
    .map((c) => c.email.trim())
    .filter(Boolean);

  if (selectedEmails.length) {
    emit("update:modelValue", selectedEmails.join("\n"));
  }
}
</script>

<style scoped>
.contact-picker {
  margin-top: 20px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.contact-picker__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.contact-picker__title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #f8fafc;
}

.contact-picker__hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.contact-picker__count {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
  white-space: nowrap;
}

.contact-picker__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.contact-picker__search {
  flex: 1;
  min-width: 200px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 12px;
}

.contact-picker__list {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  padding: 6px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
}

.contact-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.contact-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.contact-option__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-option__main strong {
  font-size: 12px;
  color: #e2e8f0;
}

.contact-option__main small {
  font-size: 11px;
  color: #94a3b8;
}

.contact-option__meta {
  font-size: 11px;
  color: #64748b;
}

.contact-picker__empty {
  padding: 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.input-wrap {
  margin-top: 10px;
}

.input-wrap label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.input-wrap textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 13px;
  box-sizing: border-box;
}
</style>
