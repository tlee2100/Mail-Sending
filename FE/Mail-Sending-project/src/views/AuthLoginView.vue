<template>
  <div class="auth">
    <div class="auth__shell">
      <div class="auth-shell__scene" aria-hidden="true">
        <span class="shell-route shell-route--one"></span>
        <span class="shell-route shell-route--two"></span>
        <span class="shell-route shell-route--three"></span>
        <span class="shell-mail shell-mail--one"></span>
        <span class="shell-mail shell-mail--two"></span>
        <span class="shell-mail shell-mail--three"></span>
      </div>

      <section class="auth__visual">
        <div class="auth__brand">
          <div class="auth__logo auth__logo--visual">CM</div>
          <span>ChadMailer</span>
        </div>
        <h2>Send smarter campaigns with a polished command center.</h2>
        <p>
          Manage SMTP accounts, templates, contacts and campaigns with a fast,
          colorful dashboard built for email teams.
        </p>
        <div class="auth__chips">
          <span>Live delivery</span>
          <span>Template flow</span>
          <span>Contact lists</span>
        </div>
        <div class="auth-preview" aria-hidden="true">
          <div class="auth-preview__header">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="auth-preview__card auth-preview__card--wide"></div>
          <div class="auth-preview__row">
            <div class="auth-preview__card"></div>
            <div class="auth-preview__card auth-preview__card--hot"></div>
          </div>
          <div class="auth-preview__progress"><span></span></div>
        </div>
      </section>

      <div class="auth__card">
        <div class="auth-card__scene" aria-hidden="true">
          <span class="scene__orb scene__orb--blue"></span>
          <span class="scene__orb scene__orb--pink"></span>
          <span class="scene__route scene__route--one"></span>
          <span class="scene__route scene__route--two"></span>
          <div class="scene-mail scene-mail--one">
            <span></span>
          </div>
          <div class="scene-mail scene-mail--two">
            <span></span>
          </div>
          <div class="scene-dashboard">
            <div class="scene-dashboard__bar"></div>
            <div class="scene-dashboard__row">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div class="auth-card__content">
          <div class="auth__logo">CM</div>
          <h1 class="auth__title">Welcome Back</h1>
          <p class="auth__subtitle">
            Sign in to open your mail sending workspace. Demo account:
            <strong>frontend.demo@email.com / Demo@123456</strong>
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
              <label for="password">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Password"
                autocomplete="current-password"
              />
            </div>

            <p v-if="errorMessage" class="auth__error">{{ errorMessage }}</p>

            <button
              class="btn btn--primary auth__submit"
              type="submit"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Signing in...</span>
              <span v-else>Sign In</span>
            </button>
          </form>

          <p class="auth__switch">
            Need an account?
            <RouterLink to="/register">Create one</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { auth } from "../stores/auth";

const router = useRouter();
const route = useRoute();

const email = ref("frontend.demo@email.com");
const password = ref("Demo@123456");
const localError = ref<string | null>(null);
const isSubmitting = ref(false);

const errorMessage = computed(() => localError.value || auth.state.error);

async function handleSubmit() {
  localError.value = null;
  if (!email.value.trim() || !password.value.trim()) {
    localError.value = "Please enter both email and password";
    return;
  }

  isSubmitting.value = true;
  try {
    await auth.login({ email: email.value, password: password.value });
    const redirect = (route.query.redirect as string) || "/";
    router.push(redirect);
  } catch (e) {
    // auth.state.error is set by the auth store
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
  background:
    radial-gradient(circle at 10% 0%, rgba(14, 165, 233, 0.26), transparent 32%),
    radial-gradient(circle at 88% 12%, rgba(236, 72, 153, 0.22), transparent 32%),
    radial-gradient(circle at 50% 100%, rgba(34, 197, 94, 0.14), transparent 36%),
    linear-gradient(135deg, var(--color-bg-sidebar), var(--color-brand-ink));
  padding: 24px;
  box-sizing: border-box;
}

.auth__shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
  gap: 28px;
  width: min(1180px, 100%);
  min-height: min(720px, calc(100vh - 48px));
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 34px;
  background:
    radial-gradient(circle at 9% 12%, rgba(14, 165, 233, 0.3), transparent 34%),
    radial-gradient(circle at 52% 0%, rgba(124, 58, 237, 0.22), transparent 30%),
    radial-gradient(circle at 88% 22%, rgba(236, 72, 153, 0.22), transparent 30%),
    radial-gradient(circle at 78% 92%, rgba(34, 197, 94, 0.22), transparent 34%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.86), rgba(30, 41, 59, 0.7));
  box-shadow: var(--shadow-modal);
  overflow: hidden;
  isolation: isolate;
  backdrop-filter: blur(22px);
}

.auth__shell::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(125, 211, 252, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(196, 181, 253, 0.08) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(circle at 56% 50%, #000 0 62%, transparent 86%);
  animation: shellGrid 16s linear infinite;
}

.auth__shell::after {
  content: "";
  position: absolute;
  inset: auto -150px -170px auto;
  z-index: 0;
  width: 430px;
  height: 430px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.36), transparent 68%);
  filter: blur(4px);
  animation: authGlow 8s ease-in-out infinite;
}

.auth-shell__scene {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.shell-route {
  position: absolute;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.58), rgba(236, 72, 153, 0.44), transparent);
  background-size: 240% 100%;
  filter: drop-shadow(0 0 12px rgba(14, 165, 233, 0.28));
  animation: routeSweep 3.8s linear infinite;
}

.shell-route--one {
  top: 20%;
  left: 9%;
  width: 48%;
  transform: rotate(-8deg);
}

.shell-route--two {
  right: 8%;
  top: 58%;
  width: 42%;
  transform: rotate(12deg);
  animation-delay: -1.1s;
}

.shell-route--three {
  left: 22%;
  bottom: 16%;
  width: 54%;
  transform: rotate(-2deg);
  animation-delay: -2s;
}

.shell-mail {
  position: absolute;
  width: 74px;
  height: 50px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.28)),
    var(--gradient-brand);
  box-shadow: 0 24px 55px rgba(14, 165, 233, 0.22);
  overflow: hidden;
}

.shell-mail::before {
  content: "";
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 50% 60%, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.32), rgba(20, 184, 166, 0.2));
}

.shell-mail::after {
  content: "";
  position: absolute;
  left: 16px;
  right: 22px;
  bottom: 13px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
}

.shell-mail--one {
  left: 44%;
  top: 13%;
  transform: rotate(12deg);
  animation: shellMailOne 7s ease-in-out infinite;
}

.shell-mail--two {
  right: 7%;
  bottom: 24%;
  transform: scale(0.88) rotate(-10deg);
  animation: shellMailTwo 8s ease-in-out infinite;
}

.shell-mail--three {
  left: 16%;
  bottom: 8%;
  transform: scale(0.72) rotate(7deg);
  opacity: 0.68;
  animation: shellMailThree 9s ease-in-out infinite;
}

.auth__visual,
.auth__card {
  position: relative;
  z-index: 2;
  width: 100%;
  border-radius: 0;
  box-shadow: none;
  color: var(--color-text-on-dark);
  border: 0;
  overflow: visible;
}

.auth__visual {
  position: relative;
  display: flex;
  min-height: 0;
  flex-direction: column;
  justify-content: center;
  padding: 26px;
  background: transparent;
  backdrop-filter: none;
}

.auth__card {
  order: -1;
}

.auth__visual::before {
  content: "";
  position: absolute;
  inset: auto -80px -110px auto;
  width: 320px;
  height: 320px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.32), transparent 66%);
  animation: authGlow 8s ease-in-out infinite;
}

.auth__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-on-solid);
  font-size: 14px;
  font-weight: 900;
}

.auth__visual h2 {
  position: relative;
  z-index: 1;
  max-width: 520px;
  margin: 58px 0 12px;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: 0;
}

.auth__visual p {
  position: relative;
  z-index: 1;
  max-width: 500px;
  margin: 0;
  color: rgba(226, 232, 240, 0.78);
  font-size: 15px;
}

.auth__chips {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.auth__chips span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  font-weight: 800;
}

.auth-preview {
  position: relative;
  z-index: 1;
  margin-top: 34px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.28);
  backdrop-filter: blur(14px);
}

.auth-preview__header {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.auth-preview__header span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--color-info-light);
}

.auth-preview__header span:nth-child(2) {
  background: var(--color-brand-pink);
}

.auth-preview__header span:nth-child(3) {
  background: var(--color-success);
}

.auth-preview__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.auth-preview__card {
  min-height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.42), rgba(99, 102, 241, 0.2));
}

.auth-preview__card--wide {
  min-height: 82px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.42), rgba(236, 72, 153, 0.26));
}

.auth-preview__card--hot {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.42), rgba(34, 197, 94, 0.22));
}

.auth-preview__progress {
  height: 8px;
  margin-top: 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.auth-preview__progress span {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-brand);
  animation: authProgress 2.8s ease-in-out infinite;
}

.auth__card {
  position: relative;
  align-self: stretch;
  display: flex;
  min-height: 0;
  align-items: center;
  padding: 18px;
  background: transparent;
  isolation: isolate;
}

.auth-card__scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.auth-card__scene::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 74%, transparent);
  opacity: 0.7;
}

.auth-card__scene::after {
  content: "";
  position: absolute;
  right: -90px;
  bottom: -110px;
  width: 340px;
  height: 340px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.3), transparent 66%);
  animation: authGlow 7s ease-in-out infinite;
}

.auth-card__content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  padding: 32px;
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 24px;
  background:
    radial-gradient(circle at 12% 0%, rgba(14, 165, 233, 0.18), transparent 34%),
    radial-gradient(circle at 92% 18%, rgba(236, 72, 153, 0.16), transparent 32%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.78));
  box-shadow: 0 28px 80px rgba(2, 6, 23, 0.34);
  backdrop-filter: blur(20px);
}

.scene__orb,
.scene__route,
.scene-mail,
.scene-dashboard {
  position: absolute;
}

.scene__orb {
  border-radius: 999px;
  filter: blur(2px);
  opacity: 0.62;
}

.scene__orb--blue {
  top: 96px;
  right: 48px;
  width: 110px;
  height: 110px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.36), transparent 68%);
  animation: driftSoft 8s ease-in-out infinite;
}

.scene__orb--pink {
  right: 94px;
  bottom: 118px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.24), transparent 68%);
  animation: driftSoft 9s ease-in-out infinite reverse;
}

.scene__route {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.34), rgba(14, 165, 233, 0.38), transparent);
  background-size: 220% 100%;
  transform-origin: left center;
  animation: routeSweep 3.2s linear infinite;
}

.scene__route--one {
  top: 145px;
  left: 42%;
  width: 240px;
  transform: rotate(-12deg);
}

.scene__route--two {
  right: 36px;
  bottom: 218px;
  width: 220px;
  transform: rotate(15deg);
  animation-delay: -1.2s;
}

.scene-mail {
  width: 86px;
  height: 58px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.66);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.46)),
    var(--gradient-brand);
  box-shadow: 0 18px 42px rgba(37, 99, 235, 0.2);
  overflow: hidden;
}

.scene-mail::before,
.scene-mail::after {
  content: "";
  position: absolute;
  inset: 0;
}

.scene-mail::before {
  clip-path: polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.28), rgba(14, 165, 233, 0.18));
}

.scene-mail::after {
  left: 16px;
  right: 16px;
  top: 36px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
}

.scene-mail span {
  position: absolute;
  left: 18px;
  right: 30px;
  top: 26px;
  z-index: 1;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.scene-mail--one {
  top: 210px;
  right: 52px;
  transform: rotate(9deg);
  animation: mailFloatOne 5.4s ease-in-out infinite;
}

.scene-mail--two {
  right: 144px;
  bottom: 74px;
  transform: scale(0.86) rotate(-13deg);
  animation: mailFloatTwo 6.2s ease-in-out infinite;
}

.scene-dashboard {
  right: 34px;
  bottom: 30px;
  width: 230px;
  padding: 14px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.28);
  box-shadow: 0 22px 54px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(16px);
}

.scene-dashboard__bar {
  height: 9px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-info-accent), var(--color-success));
  background-size: 220% 100%;
  animation: routeSweep 2.8s linear infinite;
}

.scene-dashboard__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.scene-dashboard__row span {
  min-height: 46px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.34);
}

.scene-dashboard__row span:nth-child(2) {
  background: rgba(14, 165, 233, 0.24);
}

.scene-dashboard__row span:nth-child(3) {
  background: rgba(34, 197, 94, 0.22);
}

.auth__card {
  max-width: none;
  color: var(--color-text-main);
  backdrop-filter: blur(20px);
}

.auth__logo {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: var(--gradient-campaign);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 14px;
  color: var(--color-text-on-solid);
  box-shadow: 0 16px 34px rgba(236, 72, 153, 0.28);
}

.auth__logo--visual {
  margin-bottom: 0;
}

.auth__title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 900;
  color: var(--color-text-on-solid);
}

.auth__subtitle {
  margin: 0 0 18px;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.76);
}

.auth-card__content .input-wrap label {
  color: rgba(248, 250, 252, 0.92);
}

.auth-card__content .input-wrap input {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 34px rgba(2, 6, 23, 0.16);
}

.auth__form {
  margin-top: 4px;
}

.auth__error {
  margin: 4px 0 10px;
  font-size: 13px;
  color: var(--color-danger-text);
}

.auth__submit {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}

.auth__switch {
  margin: 12px 0 0;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.76);
}

.auth__switch a {
  color: var(--color-cyan-soft);
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 1080px) {
  .auth__shell {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
    padding: 22px;
  }

  .auth__visual {
    min-height: auto;
  }

  .auth__card {
    min-height: auto;
  }

  .auth__visual h2 {
    max-width: 720px;
    margin-top: 48px;
    font-size: clamp(30px, 7vw, 42px);
  }

  .auth__visual p {
    max-width: 720px;
  }

  .auth-preview {
    margin-top: 28px;
  }
}

@media (max-width: 560px) {
  .auth {
    padding: 14px;
  }

  .auth__visual {
    display: none;
  }

  .auth__card {
    padding: 16px;
  }

  .auth-card__content {
    padding: 24px 18px;
    border-radius: 20px;
  }

  .scene-mail--one {
    top: 36px;
    right: 22px;
    opacity: 0.5;
    transform: scale(0.74) rotate(9deg);
  }

  .scene-mail--two,
  .scene-dashboard,
  .scene__route--two {
    display: none;
  }

  .scene__route--one {
    top: 104px;
    left: 36%;
    width: 160px;
  }

  .auth__visual h2 {
    margin-top: 32px;
    font-size: 28px;
  }
}

@keyframes shellGrid {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 54px 54px;
  }
}

@keyframes shellMailOne {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(12deg);
  }

  50% {
    transform: translate3d(34px, -18px, 0) rotate(6deg);
  }
}

@keyframes shellMailTwo {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.88) rotate(-10deg);
  }

  50% {
    transform: translate3d(-26px, -22px, 0) scale(0.94) rotate(-4deg);
  }
}

@keyframes shellMailThree {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.72) rotate(7deg);
  }

  50% {
    transform: translate3d(28px, -16px, 0) scale(0.78) rotate(12deg);
  }
}

@keyframes driftSoft {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-18px, 16px, 0) scale(1.08);
  }
}

@keyframes routeSweep {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 220% 0;
  }
}

@keyframes mailFloatOne {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(9deg);
  }

  50% {
    transform: translate3d(-18px, -14px, 0) rotate(5deg);
  }
}

@keyframes mailFloatTwo {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.86) rotate(-13deg);
  }

  50% {
    transform: translate3d(16px, -16px, 0) scale(0.9) rotate(-8deg);
  }
}

@keyframes authGlow {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-22px, -18px, 0) scale(1.08);
  }
}

@keyframes authProgress {
  0%,
  100% {
    width: 48%;
  }

  50% {
    width: 88%;
  }
}
</style>
