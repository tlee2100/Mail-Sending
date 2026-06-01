<template>
  <section class="content__header header-with-badge">
    <div>
      <h1 class="page-title">Profile Settings</h1>
      <p class="page-subtitle">
        Manage your personal information and account details.
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <span class="badge badge--grey">Account Management</span>
  </section>

  <div class="card card--profile">
    <div class="profile-header">
      <div class="avatar-lg">{{ initials }}</div>
      <div>
        <h2 class="profile-card-title">Personal Information</h2>
        <p class="profile-card-sub">
          Update your account details and personal information
        </p>
      </div>
    </div>
    <div class="profile-fields">
      <div class="input-wrap">
        <label>Full Name</label>
        <input v-model="fullName" type="text" :disabled="auth.state.isLoading" />
      </div>
      <div class="input-wrap">
        <label>Email Address</label>
        <input v-model="email" type="email" :disabled="auth.state.isLoading" />
      </div>
    </div>
    <div v-if="pendingEmail" class="otp-panel">
      <div>
        <h3 class="otp-title">Confirm New Email</h3>
        <p class="otp-copy">
          We sent a 6-digit OTP to <strong>{{ pendingEmail }}</strong>. Enter it
          below to finish updating your account email.
        </p>
        <p v-if="debugOtp" class="otp-debug">Demo OTP: {{ debugOtp }}</p>
      </div>
      <div class="otp-form">
        <div class="input-wrap">
          <label>Email OTP</label>
          <input
            v-model="otp"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
            :disabled="auth.state.isLoading"
          />
        </div>
        <button
          type="button"
          class="btn btn--primary"
          :disabled="auth.state.isLoading"
          @click="verifyEmailOtp"
        >
          Verify Email
        </button>
        <button
          type="button"
          class="btn btn--secondary"
          :disabled="auth.state.isLoading"
          @click="cancelEmailOtp"
        >
          Cancel
        </button>
      </div>
    </div>
    <div class="account-info">
      <h3 class="info-title">Account Information</h3>
      <p class="info-row">
        Account Created:
        <span>{{ formatDate(auth.state.user?.createdAt) }}</span>
      </p>
      <p class="info-row">
        Last Updated:
        <span>{{ formatDate(auth.state.user?.updatedAt) }}</span>
      </p>
    </div>
    <div class="profile-actions">
      <RouterLink to="/" class="link-back">Back to Dashboard</RouterLink>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="auth.state.isLoading"
        @click="saveProfile"
      >
        {{ auth.state.isLoading ? "Saving..." : "Update Profile" }}
      </button>
    </div>
  </div>

  <div class="card card--security-preview">
    <div class="security-preview-icon">Lock</div>
    <div>
      <h2 class="profile-card-title">Security Settings</h2>
      <p class="profile-card-sub">
        Keep your account secure with a strong password
      </p>
    </div>
    <RouterLink to="/security" class="btn btn--warning">Change Password</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const notice = useNotice();
const fullName = ref("");
const email = ref("");
const otp = ref("");
const pendingEmail = ref("");
const debugOtp = ref("");
const initials = computed(() =>
  (fullName.value || auth.state.user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join(""),
);

watch(
  () => [auth.state.user?.name, auth.state.user?.email] as const,
  ([name, userEmail]) => {
    if (pendingEmail.value) return;
    fullName.value = name || "";
    email.value = userEmail || "";
  },
  { immediate: true },
);

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

async function saveProfile() {
  if (!fullName.value.trim() || !email.value.trim()) {
    notice.show("Name and email are required.", "error");
    return;
  }
  try {
    const result = await auth.updateProfile({
      name: fullName.value,
      email: email.value,
    });
    if (result.requiresOtp) {
      pendingEmail.value = result.email || email.value.trim().toLowerCase();
      debugOtp.value = result.debugOtp || "";
      otp.value = "";
      notice.show(`OTP sent to ${pendingEmail.value}.`, "success");
      return;
    }

    pendingEmail.value = "";
    debugOtp.value = "";
    fullName.value = auth.state.user?.name || fullName.value;
    email.value = auth.state.user?.email || email.value;
    notice.show("Profile updated successfully.", "success");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile";
    notice.show(message, "error");
  }
}

async function verifyEmailOtp() {
  if (!pendingEmail.value) return;
  if (!/^\d{6}$/.test(otp.value.trim())) {
    notice.show("OTP must be 6 digits.", "error");
    return;
  }

  try {
    await auth.verifyProfileEmailOtp({
      email: pendingEmail.value,
      otp: otp.value,
    });
    pendingEmail.value = "";
    debugOtp.value = "";
    otp.value = "";
    fullName.value = auth.state.user?.name || "";
    email.value = auth.state.user?.email || "";
    notice.show("Profile email updated successfully.", "success");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify email OTP";
    notice.show(message, "error");
  }
}

function cancelEmailOtp() {
  pendingEmail.value = "";
  debugOtp.value = "";
  otp.value = "";
  fullName.value = auth.state.user?.name || "";
  email.value = auth.state.user?.email || "";
}
</script>

<style scoped>
.header-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.badge {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.badge--grey {
  background: var(--color-control-bg-muted);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-main);
}

.card--profile {
  padding: 24px;
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  flex-shrink: 0;
}

.profile-card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.profile-card-sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

.profile-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.otp-panel {
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-control-bg-muted);
  padding: 18px;
  margin-bottom: 24px;
}

.otp-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 6px;
}

.otp-copy,
.otp-debug {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 10px;
}

.otp-debug {
  color: var(--color-primary);
  font-weight: 600;
}

.otp-form {
  display: grid;
  grid-template-columns: minmax(160px, 240px) auto auto;
  align-items: end;
  gap: 12px;
}

.account-info {
  margin-bottom: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-subtle);
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
}

.info-row {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 6px;
}

.info-row span {
  color: var(--color-text-strong);
}

.profile-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.link-back {
  font-size: 14px;
  color: var(--color-primary);
  text-decoration: none;
}

.btn--warning {
  background: var(--color-warning);
  color: var(--color-warning-text-strong);
}

.btn--secondary {
  background: var(--color-control-bg-muted);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-main);
}

button:disabled,
input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.card--security-preview {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  border-left: 4px solid var(--color-warning);
}

.security-preview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-chip-yellow-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 600px) {
  .profile-fields,
  .otp-form {
    grid-template-columns: 1fr;
  }
}
</style>
