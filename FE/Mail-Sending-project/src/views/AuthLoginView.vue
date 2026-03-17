<template>
  <div class="auth">
    <div class="auth__card">
      <div class="auth__logo">CM</div>
      <h1 class="auth__title">ChadMailer Login</h1>
      <p class="auth__subtitle">
        Đăng nhập để truy cập Dashboard. Tài khoản demo:
        <strong>admin@demo.com / admin123</strong>
      </p>

      <form class="auth__form" @submit.prevent="handleSubmit">
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
          <label for="password">Mật khẩu</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>

        <button class="btn btn--primary auth__submit" type="submit" :disabled="isSubmitting">
          <span v-if="isSubmitting">Đang đăng nhập...</span>
          <span v-else>Đăng nhập</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '../stores/auth'

const router = useRouter()
const route = useRoute()

const email = ref('admin@demo.com')
const password = ref('admin123')
const localError = ref<string | null>(null)
const isSubmitting = ref(false)

const errorMessage = computed(() => localError.value || auth.state.error)

async function handleSubmit() {
  localError.value = null
  if (!email.value.trim() || !password.value.trim()) {
    localError.value = 'Vui lòng nhập đầy đủ email và mật khẩu'
    return
  }

  isSubmitting.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e) {
    // error đã được set trong auth.state.error
  } finally {
    isSubmitting.value = false
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
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-accent));
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

.auth__submit {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}
</style>

