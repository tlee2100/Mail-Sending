<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Email Account Management</h1>
      <p class="page-subtitle">Live sender accounts from backend</p>
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
      <div class="card__value">{{ accounts.length }}</div>
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
      <div class="card__value">{{ sentToday }}</div>
      <div class="card__label">Emails Sent Today</div>
    </div>
  </section>

  <section class="content__section">
    <div class="card card--list" v-if="accounts.length">
      <div class="account-row" v-for="account in accounts" :key="account.id">
        <div>
          <div class="account-title">
            {{ account.display_name || account.email_address }}
            <span v-if="account.is_default" class="pill">Default</span>
          </div>
          <div class="account-meta">
            {{ account.email_address }} · {{ account.smtp_host || "No SMTP host" }} ·
            {{ account.status || "active" }}
          </div>
        </div>
        <div class="account-actions">
          <button
            type="button"
            class="btn btn--secondary btn--small"
            :disabled="account.is_default"
            @click="setDefault(account.id)"
          >
            Set Default
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--small"
            @click="toggleStatus(account)"
          >
            {{ account.status === "active" ? "Pause" : "Activate" }}
          </button>
        </div>
      </div>
    </div>
    <div class="card card--empty-state" v-else>
      <h3 class="empty-title">No Email Accounts</h3>
      <p class="empty-desc">Create one sender account to enable campaign delivery.</p>
      <button type="button" class="btn btn--primary" @click="addAccount">
        + Add Email Account
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type AccountRow = {
  id: number;
  email_address: string;
  display_name?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  status?: string | null;
  is_default?: boolean;
  sent_today?: number | null;
};

const notice = useNotice();
const accounts = ref<AccountRow[]>([]);

const activeAccounts = computed(
  () => accounts.value.filter((item) => item.status === "active").length,
);
const defaultAccounts = computed(
  () => accounts.value.filter((item) => item.is_default).length,
);
const sentToday = computed(() =>
  accounts.value.reduce((sum, item) => sum + Number(item.sent_today || 0), 0),
);

async function loadAccounts() {
  if (!auth.state.token) return;
  try {
    const response = await emailAccountsApi.list(auth.state.token);
    accounts.value = response.data as AccountRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load email accounts";
    notice.show(message, "error");
  }
}

async function addAccount() {
  if (!auth.state.token) return;
  const emailAddress = window.prompt("Sender email", "");
  if (!emailAddress?.trim()) return;
  const displayName = window.prompt("Display name", "") || undefined;
  const smtpHost = window.prompt("SMTP host", "smtp.gmail.com") || undefined;
  const smtpPort = Number(window.prompt("SMTP port", "587") || 587);

  try {
    await emailAccountsApi.create(auth.state.token, {
      emailAddress: emailAddress.trim(),
      displayName,
      smtpHost,
      smtpPort,
      smtpUsername: emailAddress.trim(),
      smtpPassword: "demo-password",
      useTls: true,
      status: "active",
      isDefault: accounts.value.length === 0,
      dailyLimit: 500,
    });
    notice.show("Email account created.", "success");
    await loadAccounts();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to create email account";
    notice.show(message, "error");
  }
}

async function setDefault(id: number) {
  if (!auth.state.token) return;
  try {
    await emailAccountsApi.setDefault(auth.state.token, id);
    notice.show("Default account updated.", "success");
    await loadAccounts();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to set default account";
    notice.show(message, "error");
  }
}

async function toggleStatus(account: AccountRow) {
  if (!auth.state.token) return;
  try {
    await emailAccountsApi.update(auth.state.token, account.id, {
      status: account.status === "active" ? "inactive" : "active",
    });
    notice.show("Account status updated.", "success");
    await loadAccounts();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to update account";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadAccounts();
});
</script>

<style scoped>
.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
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

.card--blue { border-top: 3px solid #3b82f6; }
.card--green { border-top: 3px solid #22c55e; }
.card--cyan { border-top: 3px solid #06b6d4; }
.card--yellow { border-top: 3px solid #facc15; }

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

.card__label { font-size: 13px; color: #6b7280; }
.card__value { font-size: 24px; font-weight: 600; }

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

.account-title { font-size: 15px; font-weight: 600; }
.account-meta { font-size: 13px; color: var(--color-text-muted); }

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

.btn--small { padding: 6px 10px; font-size: 12px; }
.card--empty-state { padding: 40px 24px; text-align: center; }
.empty-title { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.empty-desc { font-size: 14px; color: #6b7280; margin: 0 0 20px; }

@media (max-width: 1024px) {
  .grid--stats-four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .grid--stats-four { grid-template-columns: 1fr; }
  .account-row { flex-direction: column; align-items: flex-start; }
}
</style>
