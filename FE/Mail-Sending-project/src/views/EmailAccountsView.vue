<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Email Account Management</h1>
      <p class="page-subtitle">Live sender accounts from backend</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="openCreateForm">
      + Add New Account
    </button>
  </section>

  <section class="content__section">
    <div class="card card--editor" v-if="showForm">
      <div class="editor-header">
        <div>
          <h2 class="editor-title">
            {{ editingId ? "Edit Email Account" : "Add Email Account" }}
          </h2>
          <p class="editor-subtitle">
            Enter full SMTP credentials. For Gmail, use an App Password instead of your normal password.
          </p>
        </div>
      </div>

      <div class="editor-grid">
        <div class="input-wrap">
          <label>Sender Email *</label>
          <input v-model="form.emailAddress" type="email" placeholder="you@example.com" />
        </div>
        <div class="input-wrap">
          <label>Display Name</label>
          <input v-model="form.displayName" type="text" placeholder="Your brand name" />
        </div>
        <div class="input-wrap">
          <label>SMTP Host *</label>
          <input v-model="form.smtpHost" type="text" placeholder="smtp.gmail.com" />
        </div>
        <div class="input-wrap">
          <label>SMTP Port *</label>
          <input v-model.number="form.smtpPort" type="number" min="1" max="65535" />
        </div>
        <div class="input-wrap">
          <label>SMTP Username *</label>
          <input v-model="form.smtpUsername" type="text" placeholder="SMTP username" />
        </div>
        <div class="input-wrap">
          <label>
            SMTP Password{{ editingId ? " (leave blank to keep current password)" : " *" }}
          </label>
          <input
            v-model="form.smtpPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="SMTP password or App Password"
          />
        </div>
        <div class="input-wrap">
          <label>Status</label>
          <select v-model="form.status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="input-wrap">
          <label>Daily Limit</label>
          <input v-model.number="form.dailyLimit" type="number" min="1" max="100000" />
        </div>
      </div>

      <div class="editor-options">
        <label class="checkbox-row">
          <input v-model="form.useTls" type="checkbox" />
          <span>Use TLS</span>
        </label>
        <label class="checkbox-row">
          <input v-model="form.isDefault" type="checkbox" />
          <span>Set as default account</span>
        </label>
        <label class="checkbox-row">
          <input v-model="showPassword" type="checkbox" />
          <span>Show password</span>
        </label>
      </div>

      <div class="editor-actions">
        <button type="button" class="btn btn--secondary" @click="closeForm">
          Cancel
        </button>
        <button type="button" class="btn btn--secondary" :disabled="isTesting" @click="testConnection">
          {{ isTesting ? "Testing..." : "Test SMTP Connection" }}
        </button>
        <button type="button" class="btn btn--primary" @click="saveAccount">
          {{ editingId ? "Save Changes" : "Create Account" }}
        </button>
      </div>
    </div>
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
            <span v-if="isAdmin && ownerText(account)"> · {{ ownerText(account) }}</span>
          </div>
        </div>
        <div class="account-actions">
          <button
            type="button"
            class="btn btn--secondary btn--small"
            :disabled="!canManageAccount(account)"
            :title="manageBlockedTitle(account)"
            @click="openEditForm(account)"
          >
            Edit
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--small"
            :disabled="account.is_default || !canManageAccount(account)"
            :title="manageBlockedTitle(account)"
            @click="setDefault(account.id)"
          >
            Set Default
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--small"
            :disabled="!canManageAccount(account)"
            :title="manageBlockedTitle(account)"
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
      <button type="button" class="btn btn--primary" @click="openCreateForm">
        + Add Email Account
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { emailAccountsApi } from "../api/emailAccountsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";
import {
  canManageOwnRecord,
  recordOwnerLabel,
} from "../utils/recordOwnership";

type AccountRow = {
  id: number;
  email_address: string;
  display_name?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_username?: string | null;
  use_tls?: boolean | null;
  status?: string | null;
  is_default?: boolean;
  daily_limit?: number | null;
  sent_today?: number | null;
  [key: string]: unknown;
};

const notice = useNotice();
const accounts = ref<AccountRow[]>([]);
const showForm = ref(false);
const showPassword = ref(false);
const editingId = ref<number | null>(null);
const isTesting = ref(false);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const form = reactive({
  emailAddress: "",
  displayName: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  useTls: true,
  isDefault: false,
  status: "active",
  dailyLimit: 500,
});

const activeAccounts = computed(
  () => accounts.value.filter((item) => item.status === "active").length,
);
const defaultAccounts = computed(
  () => accounts.value.filter((item) => item.is_default).length,
);
const sentToday = computed(() =>
  accounts.value.reduce((sum, item) => sum + Number(item.sent_today || 0), 0),
);
const isAdmin = computed(() => auth.state.user?.role === "admin");

function canManageAccount(account: AccountRow | null) {
  return canManageOwnRecord(account, auth.state.user);
}

function ownerText(account: AccountRow) {
  return recordOwnerLabel(account);
}

function manageBlockedTitle(account: AccountRow) {
  return canManageAccount(account)
    ? ""
    : "Admin can view this sender account here, but should not edit another user's account in the normal route.";
}

function resetForm() {
  form.emailAddress = "";
  form.displayName = "";
  form.smtpHost = "smtp.gmail.com";
  form.smtpPort = 587;
  form.smtpUsername = "";
  form.smtpPassword = "";
  form.useTls = true;
  form.isDefault = accounts.value.length === 0;
  form.status = "active";
  form.dailyLimit = 500;
  showPassword.value = false;
}

function isGmailHost(host: string) {
  return host.trim().toLowerCase() === "smtp.gmail.com";
}

function validateFormBasics(requirePassword: boolean) {
  const senderEmail = form.emailAddress.trim();
  const smtpHost = form.smtpHost.trim();
  const smtpPort = Number(form.smtpPort);
  const smtpUsername = form.smtpUsername.trim();

  if (!senderEmail) {
    notice.show("Sender email is required.", "error");
    return false;
  }
  if (!EMAIL_PATTERN.test(senderEmail)) {
    notice.show("Sender email must be a valid email address.", "error");
    return false;
  }
  if (!smtpHost) {
    notice.show("SMTP host is required.", "error");
    return false;
  }
  if (!Number.isFinite(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
    notice.show("SMTP port is invalid.", "error");
    return false;
  }
  if (isGmailHost(smtpHost) && ![465, 587].includes(smtpPort)) {
    notice.show("For Gmail, use SMTP port 587 with TLS or 465 with SSL.", "error");
    return false;
  }
  if (!smtpUsername) {
    notice.show("SMTP username is required.", "error");
    return false;
  }
  if (requirePassword && !form.smtpPassword.trim()) {
    notice.show("SMTP password is required.", "error");
    return false;
  }

  return true;
}

function openCreateForm() {
  editingId.value = null;
  resetForm();
  showForm.value = true;
}

function openEditForm(account: AccountRow) {
  if (!canManageAccount(account)) {
    notice.show(
      "Admin should not edit another user's sender account from the normal route.",
      "error",
    );
    return;
  }
  editingId.value = account.id;
  form.emailAddress = account.email_address || "";
  form.displayName = account.display_name || "";
  form.smtpHost = account.smtp_host || "smtp.gmail.com";
  form.smtpPort = Number(account.smtp_port || 587);
  form.smtpUsername = account.smtp_username || account.email_address || "";
  form.smtpPassword = "";
  form.useTls = account.use_tls ?? true;
  form.isDefault = Boolean(account.is_default);
  form.status = account.status || "active";
  form.dailyLimit = Number(account.daily_limit || 500);
  showPassword.value = false;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  resetForm();
}

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

async function saveAccount() {
  if (!auth.state.token) return;
  if (!validateFormBasics(!editingId.value)) return;

  try {
    const payload = {
      emailAddress: form.emailAddress.trim(),
      displayName: form.displayName.trim() || undefined,
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpUsername: form.smtpUsername.trim(),
      smtpPassword: form.smtpPassword.trim() || undefined,
      useTls: form.useTls,
      status: form.status,
      isDefault: form.isDefault,
      dailyLimit: Number(form.dailyLimit) || 500,
    };

    if (editingId.value) {
      await emailAccountsApi.update(auth.state.token, editingId.value, payload);
      notice.show("Email account updated.", "success");
    } else {
      await emailAccountsApi.create(auth.state.token, payload);
      notice.show("Email account created.", "success");
    }

    closeForm();
    await loadAccounts();
  } catch (error) {
    notice.show(
      getApiErrorMessage(
        error,
        editingId.value
          ? "Failed to update email account"
          : "Failed to create email account",
      ),
      "error",
    );
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const detailMessage = getApiDetailsMessage(error.details);
    return detailMessage ? `${error.message}: ${detailMessage}` : error.message;
  }
  return fallback;
}

function getApiDetailsMessage(details: unknown) {
  if (Array.isArray(details)) {
    const messages = details.flatMap((segment) => {
      const errors = (segment as { errors?: Array<{ path?: string; message?: string }> })
        .errors;
      return Array.isArray(errors)
        ? errors.map((item) => {
            const label = fieldLabel(item.path || "");
            return label ? `${label}: ${item.message}` : item.message || "";
          })
        : [];
    });
    return messages.filter(Boolean).join("; ");
  }

  if (details && typeof details === "object" && "reason" in details) {
    return String((details as { reason?: unknown }).reason || "");
  }

  return "";
}

function fieldLabel(path: string) {
  return (
    {
      emailAddress: "Sender email",
      smtpHost: "SMTP host",
      smtpPort: "SMTP port",
      smtpUsername: "SMTP username",
      smtpPassword: "SMTP password",
      dailyLimit: "Daily limit",
    } as Record<string, string>
  )[path] || path;
}

async function testConnection() {
  if (!auth.state.token) return;
  if (!validateFormBasics(!editingId.value)) return;

  isTesting.value = true;
  try {
    await emailAccountsApi.testConnection(auth.state.token, {
      accountId: editingId.value || undefined,
      emailAddress: form.emailAddress.trim() || undefined,
      displayName: form.displayName.trim() || undefined,
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpUsername: form.smtpUsername.trim(),
      smtpPassword: form.smtpPassword.trim() || undefined,
      useTls: form.useTls,
    });
    notice.show("SMTP connection successful.", "success");
  } catch (error) {
    notice.show(
      getApiErrorMessage(error, "SMTP connection test failed"),
      "error",
    );
  } finally {
    isTesting.value = false;
  }
}

async function setDefault(id: number) {
  if (!auth.state.token) return;
  const account = accounts.value.find((item) => item.id === id);
  if (account && !canManageAccount(account)) {
    notice.show(
      "Admin should not update another user's sender account from the normal route.",
      "error",
    );
    return;
  }
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
  if (!canManageAccount(account)) {
    notice.show(
      "Admin should not update another user's sender account from the normal route.",
      "error",
    );
    return;
  }
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

.card--editor {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 24px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.editor-subtitle {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.editor-options {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.card--stat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-text-main);
}

.card--blue { border-top: 3px solid var(--color-info-soft); }
.card--green { border-top: 3px solid var(--color-success); }
.card--cyan { border-top: 3px solid var(--color-primary-accent); }
.card--yellow { border-top: 3px solid var(--color-warning-soft); }

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

.card__label { font-size: 13px; color: var(--color-text-muted); }
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
  background: var(--color-primary-bg-active);
  color: var(--color-primary-text);
  font-size: 11px;
}

.btn--small { padding: 6px 10px; font-size: 12px; }
.card--empty-state { padding: 40px 24px; text-align: center; }
.empty-title { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.empty-desc { font-size: 14px; color: var(--color-text-muted); margin: 0 0 20px; }

@media (max-width: 1024px) {
  .grid--stats-four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .editor-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .grid--stats-four { grid-template-columns: 1fr; }
  .account-row { flex-direction: column; align-items: flex-start; }
}
</style>
