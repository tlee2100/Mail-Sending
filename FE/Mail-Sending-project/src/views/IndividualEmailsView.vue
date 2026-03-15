<template>
  <section class="content__header">
    <h1 class="page-title">✉️ Send Individual Emails</h1>
    <p class="page-subtitle">Send personalized emails to specific recipients by entering their email addresses.</p>
  </section>

  <!-- SMTP Not Configured Warning -->
  <div class="alert alert--danger">
    <span class="alert__icon">⚙️</span>
    <span class="alert__icon alert__icon--warn">⚠️</span>
    <div class="alert__body">
      <strong>SMTP Not Configured</strong>
      <span>You need to configure your SMTP email account before sending emails. Please go to Email Accounts to set up your SMTP settings.</span>
    </div>
    <RouterLink to="/email-accounts" class="btn btn--danger">⚙️ Go to Email Accounts Settings</RouterLink>
  </div>

  <div class="grid grid--individual">
    <div class="card card--form">
      <h2 class="card__heading"><span class="card__heading-icon">✉️</span> Email Configuration</h2>
      <div class="input-wrap">
        <label>Recipients *</label>
        <textarea
          v-model="recipients"
          placeholder="Enter email addresses (comma or newline separated)"
          rows="8"
        ></textarea>
        <p class="input-hint">e.g. john@example.com, jane@example.com, mike@example.com</p>
      </div>
      <RouterLink to="/individual-emails/compose" class="btn btn--primary">Continue to Compose</RouterLink>
    </div>

    <div class="card card--guidelines">
      <h2 class="card__heading"><span class="card__heading-icon card__heading-icon--warn">⚠️</span> Email Guidelines</h2>
      <ul class="guidelines-list">
        <li><span class="check">✓</span> Enter one or multiple email addresses</li>
        <li><span class="check">✓</span> Separate emails with commas or new lines</li>
        <li><span class="check">✓</span> Use Email Editor for professional designs</li>
        <li><span class="check">✓</span> Send preview before sending to all</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const recipients = ref('')
</script>

<style scoped>
.alert {
  display: flex;
  align-items: center;
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
.alert__icon {
  font-size: 20px;
}
.alert__icon--warn {
  opacity: 0.9;
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
  opacity: 0.95;
}
.grid--individual {
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}
.card__heading {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__heading-icon {
  font-size: 18px;
}
.card__heading-icon--warn {
  background: rgba(234, 179, 8, 0.2);
  padding: 4px;
  border-radius: 50%;
}
.input-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}
.guidelines-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.guidelines-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}
.check {
  color: #22c55e;
  font-weight: bold;
}
@media (max-width: 900px) {
  .grid--individual {
    grid-template-columns: 1fr;
  }
}
</style>
