<template>
  <section class="content__header">
    <h1 class="page-title">Send Individual Emails</h1>
    <p class="page-subtitle">
      Send personalized emails to specific recipients by entering their email addresses.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <div class="alert" :class="hasAccounts ? 'alert--success' : 'alert--danger'">
    <span class="alert__body">
      <strong>{{ hasAccounts ? "SMTP Ready" : "SMTP Not Configured" }}</strong>
      <span>
        {{
          hasAccounts
            ? "A mock sender account is available. You can proceed to compose."
            : "Add an email account first so preview and send actions have a sender."
        }}
      </span>
    </span>
    <RouterLink to="/email-accounts" class="btn" :class="hasAccounts ? 'btn--secondary' : 'btn--danger'">
      Email Accounts
    </RouterLink>
  </div>

  <div class="grid grid--individual">
    <div class="card card--form">
      <h2 class="card__heading">Email Configuration</h2>
      <div class="input-wrap">
        <label>Recipients *</label>
        <textarea
          v-model="recipients"
          placeholder="Enter email addresses (comma or newline separated)"
          rows="8"
        ></textarea>
        <p class="input-hint">
          e.g. john@example.com, jane@example.com, mike@example.com
        </p>
      </div>
      <RouterLink to="/individual-emails/compose" class="btn btn--primary">
        Continue to Compose
      </RouterLink>
    </div>

    <div class="card card--guidelines">
      <h2 class="card__heading">Email Guidelines</h2>
      <ul class="guidelines-list">
        <li>Enter one or multiple email addresses</li>
        <li>Separate emails with commas or new lines</li>
        <li>Use Email Editor for professional designs</li>
        <li>Send preview before sending to all</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const recipients = ref(mockWorkspace.state.composeDraft.recipients);
const hasAccounts = computed(() => mockWorkspace.state.emailAccounts.length > 0);

watch(recipients, () => {
  mockWorkspace.saveComposeDraft({ recipients: recipients.value });
});
</script>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.alert--danger {
  background: #dc2626;
  color: white;
}

.alert--success {
  background: rgba(34, 197, 94, 0.12);
  color: #166534;
}

.alert__body {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert__body span {
  font-size: 13px;
}

.grid--individual {
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.card__heading {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.input-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

.guidelines-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: #374151;
}

@media (max-width: 900px) {
  .grid--individual {
    grid-template-columns: 1fr;
  }
}
</style>
