<template>
  <section class="content__header header-with-badge">
    <div>
      <h1 class="page-title">Security Settings</h1>
      <p class="page-subtitle">Update your password to keep your account secure.</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <span class="badge badge--yellow">Account Security</span>
  </section>

  <div class="card card--password">
    <h2 class="card__heading">Change Password</h2>
    <p class="card__sub">
      Enter your current password and choose a new secure password.
    </p>
    <div class="password-fields">
      <div class="input-wrap">
        <label>Current Password</label>
        <div class="input-with-icon">
          <input
            v-model="currentPassword"
            :type="showCurrent ? 'text' : 'password'"
            placeholder="Enter your current password"
            :disabled="otpSent"
          />
          <button type="button" class="input-icon-btn" @click="showCurrent = !showCurrent">
            {{ showCurrent ? "Hide" : "Show" }}
          </button>
        </div>
      </div>
      <div class="password-row">
        <div class="input-wrap">
          <label>New Password</label>
          <div class="input-with-icon">
            <input
              v-model="newPassword"
              :type="showNew ? 'text' : 'password'"
              placeholder="Enter new password"
              :disabled="otpSent"
            />
            <button type="button" class="input-icon-btn" @click="showNew = !showNew">
              {{ showNew ? "Hide" : "Show" }}
            </button>
          </div>
        </div>
        <div class="input-wrap">
          <label>Confirm New Password</label>
          <div class="input-with-icon">
            <input
              v-model="confirmPassword"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Confirm new password"
              :disabled="otpSent"
            />
            <button type="button" class="input-icon-btn" @click="showConfirm = !showConfirm">
              {{ showConfirm ? "Hide" : "Show" }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="otpSent" class="input-wrap">
        <label>Email OTP</label>
        <input
          v-model="otp"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="Enter the 6-digit OTP"
          autocomplete="one-time-code"
        />
        <p class="otp-hint">
          We sent an OTP to {{ otpEmail }}. The code expires in
          {{ otpExpiresInMinutes }} minutes.
        </p>
        <p v-if="debugOtp" class="otp-hint">
          Local demo OTP: <strong>{{ debugOtp }}</strong>
        </p>
      </div>
    </div>
    <div class="password-actions">
      <RouterLink to="/profile" class="link-back">Back to Profile</RouterLink>
      <button type="button" class="btn btn--warning" :disabled="isSubmitting" @click="updatePassword">
        {{ isSubmitting ? "Processing..." : otpSent ? "Verify OTP & Update" : "Send OTP" }}
      </button>
    </div>
  </div>

  <section class="content__section">
    <h2 class="section-title">Security Tips</h2>
    <div class="grid grid--tips">
      <div class="card card--tip card--tip-green">
        <span class="tip-icon">Tip</span>
        <h3 class="tip-title">Use Strong Passwords</h3>
        <p class="tip-desc">
          Combine letters, numbers, and symbols for better security.
        </p>
      </div>
      <div class="card card--tip card--tip-green">
        <span class="tip-icon">Tip</span>
        <h3 class="tip-title">Regular Updates</h3>
        <p class="tip-desc">
          Change your password regularly to maintain security.
        </p>
      </div>
      <div class="card card--tip card--tip-yellow">
        <span class="tip-icon">Warn</span>
        <h3 class="tip-title">Avoid Common Words</h3>
        <p class="tip-desc">
          Don't use easily guessable information like names or dates.
        </p>
      </div>
      <div class="card card--tip card--tip-purple">
        <span class="tip-icon">Tip</span>
        <h3 class="tip-title">Unique Passwords</h3>
        <p class="tip-desc">
          Use different passwords for different accounts.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

const notice = useNotice();
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const otp = ref("");
const otpSent = ref(false);
const otpEmail = ref("");
const otpExpiresInMinutes = ref(10);
const debugOtp = ref("");
const isSubmitting = ref(false);
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

async function updatePassword() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    notice.show("Please complete all password fields.", "error");
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    notice.show("New password and confirm password must match.", "error");
    return;
  }
  if (newPassword.value.length < 8) {
    notice.show("New password must be at least 8 characters.", "error");
    return;
  }

  if (otpSent.value) {
    if (!/^\d{6}$/.test(otp.value.trim())) {
      notice.show("Please enter the 6-digit OTP.", "error");
      return;
    }

    isSubmitting.value = true;
    try {
      await auth.verifyPasswordChangeOtp({ otp: otp.value.trim() });
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
      otp.value = "";
      otpSent.value = false;
      otpEmail.value = "";
      debugOtp.value = "";
      notice.show("Password updated.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password";
      notice.show(message, "error");
    } finally {
      isSubmitting.value = false;
    }
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await auth.requestPasswordChangeOtp({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    otpSent.value = true;
    otpEmail.value = response.email;
    otpExpiresInMinutes.value = response.expiresInMinutes || 10;
    debugOtp.value = response.debugOtp || "";
    notice.show("OTP sent to your email.", "success");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send password OTP";
    notice.show(message, "error");
  } finally {
    isSubmitting.value = false;
  }
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

.badge--yellow {
  background: var(--color-chip-yellow-bg);
  border: 1px solid var(--color-chip-yellow-border);
  color: var(--color-chip-yellow-text);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.card--password {
  padding: 24px;
  margin-bottom: 28px;
}

.card__heading {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
}

.card__sub {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 20px;
}

.password-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 24px;
}

.password-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input-with-icon {
  position: relative;
  display: flex;
}

.input-with-icon input {
  padding-right: 60px;
  width: 100%;
  box-sizing: border-box;
}

.input-icon-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 4px;
}

.password-actions {
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

.otp-hint {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
}

.grid--tips {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.card--tip {
  padding: 18px;
}

.card--tip-green {
  background: var(--color-success-bg-muted);
  border-left: 4px solid var(--color-success);
}

.card--tip-yellow {
  background: var(--color-warning-bg-muted);
  border-left: 4px solid var(--color-warning);
}

.card--tip-purple {
  background: var(--color-primary-bg-muted);
  border-left: 4px solid var(--color-purple);
}

.tip-icon {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  display: block;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--color-text-strong);
}

.tip-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .grid--tips {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .password-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .grid--tips {
    grid-template-columns: 1fr;
  }
}
</style>
