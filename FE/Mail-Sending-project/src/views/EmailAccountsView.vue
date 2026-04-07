<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Email Account <span class="title-accent">Management</span></h1>
      <p class="page-subtitle">
        Configure and manage your SMTP email accounts for bulk sending.
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="addAccount">
      + Add New Account
    </button>
  </section>

  <section class="grid grid--stats-four">
    <div class="card card--stat card--blue">
      <div class="card__icon">SMTP</div>
      <div class="card__value">{{ totalAccounts }}</div>
      <div class="card__label">Total Accounts</div>
    </div>
    <div class="card card--stat card--green">
      <div class="card__icon">Live</div>
      <div class="card__value">{{ activeAccounts }}</div>
      <div class="card__label">Active Accounts</div>
    </div>
    <div class="card card--stat card--cyan">
      <div class="card__icon">Default</div>
      <div class="card__value">{{ defaultAccounts }}</div>
      <div class="card__label">Default Account</div>
    </div>
    <div class="card card--stat card--yellow">
      <div class="card__icon">Sent</div>
      <div class="card__value">{{ totalSent }}</div>
      <div class="card__label">Emails Sent</div>
    </div>
  </section>

  <section class="content__section" v-if="accounts.length">
    <div class="card card--list">
      <div class="account-row" v-for="account in accounts" :key="account.id">
        <div>
          <div class="account-title">
            {{ account.name }}
            <span v-if="account.isDefault" class="pill">Default</span>
          </div>
          <div class="account-meta">
            {{ account.emailAddress }} · {{ account.provider }} ·
            {{ account.isActive ? "Active" : "Paused" }}
          </div>
        </div>
        <div class="account-actions">
          <button
            type="button"
            class="btn btn--secondary btn--small"
            @click="makeDefault(account.id)"
            :disabled="account.isDefault"
          >
            Set Default
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--small"
            @click="toggleAccount(account.id)"
          >
            {{ account.isActive ? "Pause" : "Activate" }}
          </button>
        </div>
      </div>
    </div>
  </section>

  <section class="content__section" v-else>
    <div class="card card--empty-state">
      <div class="empty-icon">SMTP</div>
      <h3 class="empty-title">No Email Accounts</h3>
      <p class="empty-desc">Add your first SMTP account to start sending emails.</p>
      <button type="button" class="btn btn--primary" @click="addAccount">
        + Add Email Account
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const notice = useNotice();
const accounts = computed(() => mockWorkspace.state.emailAccounts);
const totalAccounts = computed(() => accounts.value.length);
const activeAccounts = computed(
  () => accounts.value.filter((item) => item.isActive).length,
);
const defaultAccounts = computed(
  () => accounts.value.filter((item) => item.isDefault).length,
);
const totalSent = computed(() =>
  accounts.value.reduce((sum, item) => sum + item.emailsSent, 0),
);

function addAccount() {
  const emailAddress = window.prompt("Sender email", "sales@example.com");
  if (!emailAddress?.trim()) return;
  const name =
    window.prompt("Account label", emailAddress.split("@")[0] || "New SMTP") ||
    "New SMTP";
  const account = mockWorkspace.addEmailAccount({
    name,
    emailAddress,
    provider: "SMTP",
  });
  notice.show(`Added ${account.emailAddress}.`, "success");
}

function makeDefault(id: string) {
  mockWorkspace.setDefaultEmailAccount(id);
  notice.show("Default sender updated.", "success");
}

function toggleAccount(id: string) {
  const account = mockWorkspace.toggleEmailAccount(id);
  if (!account) {
    notice.show("Account not found.", "error");
    return;
  }
  notice.show(
    `${account.emailAddress} is now ${account.isActive ? "active" : "paused"}.`,
    "info",
  );
}
</script>

<style scoped>
.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.title-accent {
  color: #6366f1;
}

.grid--stats-four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 24px;
}

.card--stat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #0f172a;
}

.card--blue {
  border-top: 3px solid #3b82f6;
}

.card--green {
  border-top: 3px solid #22c55e;
}

.card--cyan {
  border-top: 3px solid #06b6d4;
}

.card--yellow {
  border-top: 3px solid #facc15;
}

.card__icon {
  width: 54px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.card--blue .card__icon {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.card--green .card__icon {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.card--cyan .card__icon {
  background: rgba(6, 182, 212, 0.14);
  color: #0e7490;
}

.card--yellow .card__icon {
  background: rgba(250, 204, 21, 0.16);
  color: #a16207;
}

.card__label {
  font-size: 13px;
  color: #6b7280;
}

.card__value {
  font-size: 24px;
  font-weight: 600;
}

.card--list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.account-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.account-title {
  font-size: 15px;
  font-weight: 600;
}

.account-meta {
  font-size: 13px;
  color: var(--color-text-muted);
}

.account-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.12);
  color: #4338ca;
  font-size: 11px;
}

.btn--small {
  padding: 6px 10px;
  font-size: 12px;
}

.card--empty-state {
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed #d1d5db;
  background: #fafafa;
}

.empty-icon {
  font-size: 22px;
  font-weight: 700;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #111827;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
}

@media (max-width: 1024px) {
  .grid--stats-four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .grid--stats-four {
    grid-template-columns: 1fr;
  }

  .account-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
