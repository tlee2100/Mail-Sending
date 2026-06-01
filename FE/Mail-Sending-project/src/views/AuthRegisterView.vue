<template>
  <div class="auth">
    <div class="auth__card">
      <div class="auth__logo">CM</div>
      <h1 class="auth__title">Create Your ChadMailer Account</h1>
      <p class="auth__subtitle">
        Start with your team workspace and verify your email with OTP.
      </p>

      <form class="auth__form" @submit.prevent="handleSubmit">
        <div class="input-wrap">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Your full name"
            autocomplete="name"
            :disabled="otpSent"
          />
        </div>
        <div class="input-wrap">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            :disabled="otpSent"
          />
        </div>
        <div class="input-wrap">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="At least 8 characters"
            autocomplete="new-password"
            :disabled="otpSent"
          />
        </div>
        <div v-if="otpSent" class="input-wrap">
          <label for="otp">Email OTP</label>
          <input
            id="otp"
            v-model="otp"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="Enter the 6-digit OTP"
            autocomplete="one-time-code"
          />
          <p class="auth__hint">
            We sent an OTP to {{ otpEmail }}. The code expires in
            {{ otpExpiresInMinutes }} minutes.
          </p>
          <p v-if="debugOtp" class="auth__hint">
            Local demo OTP: <strong>{{ debugOtp }}</strong>
          </p>
        </div>

        <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>

        <button
          class="btn btn--primary auth__submit"
          type="submit"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">{{ otpSent ? "Verifying OTP..." : "Sending OTP..." }}</span>
          <span v-else>{{ otpSent ? "Verify & Create Account" : "Send OTP" }}</span>
        </button>
        <button
          v-if="otpSent"
          class="btn auth__secondary"
          type="button"
          :disabled="isSubmitting"
          @click="resetOtpStep"
        >
          Change email
        </button>
      </form>

      <p class="auth__switch">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { auth } from "../stores/auth";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const otp = ref("");
const otpSent = ref(false);
const otpEmail = ref("");
const otpExpiresInMinutes = ref(10);
const debugOtp = ref("");
const isSubmitting = ref(false);
const localError = ref<string | null>(null);

const errorMessage = computed(() => localError.value || auth.state.error);

async function handleSubmit() {
  localError.value = null;
  if (!otpSent.value) {
    if (!name.value.trim() || !email.value.trim() || !password.value.trim()) {
      localError.value = "Please complete all fields";
      return;
    }

    isSubmitting.value = true;
    try {
      const response = await auth.requestRegisterOtp({
        name: name.value,
        email: email.value,
        password: password.value,
        role: "user",
      });
      otpSent.value = true;
      otpEmail.value = response.email;
      otpExpiresInMinutes.value = response.expiresInMinutes || 10;
      debugOtp.value = response.debugOtp || "";
    } finally {
      isSubmitting.value = false;
    }
    return;
  }

  if (!/^\d{6}$/.test(otp.value.trim())) {
    localError.value = "Please enter the 6-digit OTP";
    return;
  }

  isSubmitting.value = true;
  try {
    await auth.verifyRegisterOtp({
      email: otpEmail.value || email.value,
      otp: otp.value.trim(),
    });
    router.push("/");
  } finally {
    isSubmitting.value = false;
  }
}

function resetOtpStep() {
  otpSent.value = false;
  otp.value = "";
  otpEmail.value = "";
  debugOtp.value = "";
  localError.value = null;
}
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: radial-gradient(
    circle at top left,
    var(--color-primary) 0,
    var(--color-bg-app) 45%,
    var(--color-bg-app) 100%
  );
}

.auth__card {
  width: 100%;
  max-width: 440px;
  border-radius: 18px;
  padding: 28px 24px;
  background: var(--color-bg-sidebar);
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
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 14px;
}

.auth__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.auth__subtitle {
  margin: 8px 0 16px;
  font-size: 13px;
  color: var(--color-text-soft);
}

.auth__submit {
  width: 100%;
  justify-content: center;
}

.auth__secondary {
  width: 100%;
  justify-content: center;
  background: var(--color-control-bg);
  color: var(--color-text-on-dark);
}

.auth__error {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-badge-error-text);
}

.auth__hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-text-soft);
}

.auth__switch {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--color-text-soft);
}

.auth__switch a {
  color: var(--color-primary-accent);
  text-decoration: none;
}
</style>
