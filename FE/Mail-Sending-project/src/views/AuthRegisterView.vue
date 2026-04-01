<template>
  <div class="auth">
    <div class="auth__card">
      <div class="auth__logo">CM</div>
      <h1 class="auth__title">Create Your ChadMailer Account</h1>
      <p class="auth__subtitle">
        Start with your team workspace and connect your first campaign flow.
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
          />
        </div>
        <div class="input-wrap">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="At least 6 characters"
            autocomplete="new-password"
          />
        </div>

        <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>

        <button
          class="btn btn--primary auth__submit"
          type="submit"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">Creating account...</span>
          <span v-else>Create Account</span>
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
const isSubmitting = ref(false);
const localError = ref<string | null>(null);

const errorMessage = computed(() => localError.value || auth.state.error);

async function handleSubmit() {
  localError.value = null;
  if (!name.value.trim() || !email.value.trim() || !password.value.trim()) {
    localError.value = "Please complete all fields";
    return;
  }

  isSubmitting.value = true;
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      role: "admin",
    });
    router.push("/");
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

.auth__error {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-badge-error-text);
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
