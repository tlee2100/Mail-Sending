<template>
  <div class="auth">
    <div class="auth__card">
      <div class="auth__logo">CM</div>
      <h1 class="auth__title">{{ modeTitle }}</h1>
      <p class="auth__subtitle">{{ modeSubtitle }}</p>

      <form v-if="mode === 'login'" class="auth__form" @submit.prevent="handleLogin">
        <div class="input-wrap">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <div class="input-wrap">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Password"
            autocomplete="current-password"
          />
        </div>

        <div class="auth__row">
          <button type="button" class="auth__link" @click="switchToForgot">
            Forgot password?
          </button>
        </div>

        <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth__success">{{ successMessage }}</p>

        <button
          class="btn btn--primary auth__submit"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Signing in..." : "Login" }}
        </button>
      </form>

      <form
        v-else-if="mode === 'forgot'"
        class="auth__form"
        @submit.prevent="handleRequestResetOtp"
      >
        <div class="input-wrap">
          <label for="reset-email">Account Email</label>
          <input
            id="reset-email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth__success">{{ successMessage }}</p>

        <button
          class="btn btn--primary auth__submit"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Sending OTP..." : "Send Reset OTP" }}
        </button>
        <button
          type="button"
          class="btn btn--secondary auth__secondary"
          @click="backToLogin"
        >
          Back to Login
        </button>
      </form>

      <form v-else class="auth__form" @submit.prevent="handleVerifyResetOtp">
        <div class="input-wrap">
          <label for="otp">OTP</label>
          <input
            id="otp"
            v-model="resetOtp"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
            autocomplete="one-time-code"
          />
        </div>

        <div class="input-wrap">
          <label for="new-password">New Password</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            placeholder="At least 8 characters"
            autocomplete="new-password"
          />
        </div>

        <div class="input-wrap">
          <label for="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat new password"
            autocomplete="new-password"
          />
        </div>

        <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth__success">{{ successMessage }}</p>

        <button
          class="btn btn--primary auth__submit"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Resetting..." : "Reset Password" }}
        </button>
        <button
          type="button"
          class="btn btn--secondary auth__secondary"
          @click="switchToForgot"
        >
          Resend OTP
        </button>
      </form>

      <p class="auth__switch">
        No account yet?
        <RouterLink to="/register">Create account</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { auth } from "../stores/auth";

const router = useRouter();
const route = useRoute();

const email = ref("frontend.demo@email.com");
const password = ref("Demo@123456");
const resetOtp = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const localError = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isSubmitting = ref(false);
const mode = ref<"login" | "forgot" | "reset">("login");

const errorMessage = computed(() => localError.value || auth.state.error);
const modeTitle = computed(() => {
  if (mode.value === "forgot") return "Forgot Password";
  if (mode.value === "reset") return "Create New Password";
  return "ChadMailer Login";
});
const modeSubtitle = computed(() => {
  if (mode.value === "forgot") {
    return "Enter your account email and we will send a 6-digit OTP.";
  }
  if (mode.value === "reset") {
    return `Enter the OTP sent to ${email.value.trim() || "your email"} and create a new password.`;
  }
  return "Login to access your dashboard. Demo account: frontend.demo@email.com / Demo@123456";
});

function clearMessages() {
  localError.value = null;
  successMessage.value = null;
  auth.state.error = null;
}

function switchToForgot() {
  clearMessages();
  resetOtp.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  mode.value = "forgot";
}

function backToLogin() {
  clearMessages();
  mode.value = "login";
}

async function handleLogin() {
  clearMessages();
  if (!email.value.trim() || !password.value.trim()) {
    localError.value = "Please enter email and password.";
    return;
  }

  isSubmitting.value = true;
  try {
    await auth.login({ email: email.value, password: password.value });
    const redirect = (route.query.redirect as string) || "/";
    router.push(redirect);
  } catch (_error) {
    // error is exposed through errorMessage
  } finally {
    isSubmitting.value = false;
  }
}

async function handleRequestResetOtp() {
  clearMessages();
  if (!email.value.trim()) {
    localError.value = "Please enter your account email.";
    return;
  }

  isSubmitting.value = true;
  try {
    const result = await auth.requestPasswordResetOtp({ email: email.value });
    mode.value = "reset";
    successMessage.value = result.debugOtp
      ? `OTP sent. Demo OTP: ${result.debugOtp}`
      : "If this email exists, a reset OTP has been sent.";
  } catch (_error) {
    // error is exposed through errorMessage
  } finally {
    isSubmitting.value = false;
  }
}

async function handleVerifyResetOtp() {
  clearMessages();
  if (!/^\d{6}$/.test(resetOtp.value.trim())) {
    localError.value = "OTP must be 6 digits.";
    return;
  }
  if (newPassword.value.trim().length < 8) {
    localError.value = "New password must be at least 8 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    localError.value = "Passwords do not match.";
    return;
  }

  isSubmitting.value = true;
  try {
    await auth.verifyPasswordResetOtp({
      email: email.value,
      otp: resetOtp.value,
      newPassword: newPassword.value,
    });
    password.value = "";
    resetOtp.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    mode.value = "login";
    successMessage.value = "Password reset successful. Login with your new password.";
  } catch (_error) {
    // error is exposed through errorMessage
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at top left,
    var(--color-primary) 0,
    var(--color-bg-app) 40%,
    var(--color-bg-app) 100%
  );
  padding: 16px;
  box-sizing: border-box;
}

.auth__card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-sidebar);
  border-radius: 18px;
  padding: 26px 24px 24px;
  box-shadow: var(--shadow-elevated);
  color: var(--color-text-on-dark);
  border: 1px solid var(--color-border-subtle);
}

.auth__logo {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-primary-accent)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 14px;
}

.auth__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}

.auth__subtitle {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--color-text-soft);
}

.auth__form {
  margin-top: 4px;
}

.auth__error {
  margin: 4px 0 10px;
  font-size: 13px;
  color: var(--color-badge-error-text);
}

.auth__success {
  margin: 4px 0 10px;
  font-size: 13px;
  color: var(--color-success-text-strong);
}

.auth__submit {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}

.auth__secondary {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}

.auth__row {
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 10px;
}

.auth__link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-primary-accent);
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
}

.auth__switch {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--color-text-soft);
}

.auth__switch a {
  color: var(--color-primary-accent);
  text-decoration: none;
}
</style>
