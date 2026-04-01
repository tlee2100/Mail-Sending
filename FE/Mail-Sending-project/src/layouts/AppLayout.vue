<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="brand__logo">CM</div>
        <div class="brand__text">
          <div class="brand__name">ChadMailer</div>
          <div class="brand__subtitle">Professional Email Marketing</div>
        </div>
      </div>

      <nav class="sidebar__nav">
        <div class="nav__section">
          <div class="nav__title">Main Menu</div>
          <RouterLink to="/" class="nav__item" active-class="nav__item--active">
            <span class="nav__icon">📊</span>
            <span>Dashboard</span>
          </RouterLink>
          <RouterLink
            to="/instant-campaign"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">⚡</span>
            <span>Instant Campaign</span>
          </RouterLink>
          <RouterLink
            to="/individual-emails"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">✉️</span>
            <span>Individual Emails</span>
          </RouterLink>
          <RouterLink
            to="/email-templates"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">📄</span>
            <span>Email Templates</span>
          </RouterLink>
          <RouterLink
            to="/email-contacts"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">👥</span>
            <span>Email Contacts</span>
          </RouterLink>
          <RouterLink
            to="/contact-tags"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">🏷️</span>
            <span>Contact Tags</span>
          </RouterLink>
          <RouterLink
            to="/campaigns"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">🚀</span>
            <span>Campaigns</span>
          </RouterLink>
        </div>

        <div class="nav__section">
          <div class="nav__title">Advanced</div>
          <RouterLink
            to="/contacts/import-export"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">📥</span>
            <span>Import / Export</span>
          </RouterLink>
          <RouterLink
            to="/contacts/fields"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">🧩</span>
            <span>Contact Fields</span>
          </RouterLink>
          <RouterLink
            to="/templates/1/designer"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">🛠️</span>
            <span>Template Designer</span>
          </RouterLink>
        </div>

        <div class="nav__section">
          <div class="nav__title">Management</div>
          <RouterLink
            to="/email-accounts"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">📨</span>
            <span>Email Accounts</span>
          </RouterLink>
          <RouterLink
            to="/payment"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">💳</span>
            <span>Payment Integration</span>
          </RouterLink>
        </div>

        <div class="nav__section">
          <div class="nav__title">Account</div>
          <RouterLink
            to="/profile"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">👤</span>
            <span>Profile</span>
          </RouterLink>
          <RouterLink
            to="/security"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">🔐</span>
            <span>Security</span>
          </RouterLink>
        </div>
      </nav>

      <button class="sidebar__logout" @click="handleLogout">
        <span class="nav__icon">⏻</span>
        <span>Logout</span>
      </button>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar__breadcrumb">
          <span class="muted">{{ breadcrumb }}</span>
        </div>
        <div class="topbar__right">
          <button class="theme-toggle" type="button" @click="toggleTheme">
            <span v-if="isDark">🌙 Dark</span>
            <span v-else>☀️ Light</span>
          </button>
          <span class="topbar__welcome">Welcome back</span>
          <div class="topbar__avatar">A</div>
          <span class="topbar__name">Admin</span>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import { auth } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const breadcrumb = computed(
  () => (route.meta.breadcrumb as string) || "Dashboard",
);

const isDark = ref(false);

const THEME_KEY = "ui.theme.v1";

function applyTheme(dark: boolean) {
  const body = document.body;
  if (dark) body.classList.add("dark-mode");
  else body.classList.remove("dark-mode");
}

function loadInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") {
      isDark.value = true;
      applyTheme(true);
      return;
    }
  } catch {
    // ignore
  }
  isDark.value = false;
  applyTheme(false);
}

function toggleTheme() {
  isDark.value = !isDark.value;
  applyTheme(isDark.value);
  try {
    localStorage.setItem(THEME_KEY, isDark.value ? "dark" : "light");
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadInitialTheme();
});

async function handleLogout() {
  await auth.logout();
  router.push({ name: "login" });
}
</script>

<style scoped>
.theme-toggle {
  margin-right: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
}

.theme-toggle:hover {
  background: rgba(148, 163, 184, 0.12);
}
</style>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "SF Pro Text",
    sans-serif;
}

.sidebar {
  background: var(--color-bg-sidebar);
  color: var(--color-text-on-dark);
  display: flex;
  flex-direction: column;
  padding: 20px 18px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
  margin-bottom: 16px;
}

.brand__logo {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.brand__name {
  font-weight: 600;
  font-size: 15px;
}

.brand__subtitle {
  font-size: 11px;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

.nav__section + .nav__section {
  margin-top: 18px;
}

.nav__title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 4px;
}

.nav__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  text-decoration: none;
  margin-bottom: 2px;
  box-sizing: border-box;
}

.nav__item:hover {
  background: rgba(30, 64, 175, 0.8);
}

.nav__item--active {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-primary-soft)
  );
  box-shadow: var(--shadow-primary);
}

.nav__item--active .nav__icon {
  background: rgba(15, 23, 42, 0.14);
}

.nav__icon {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: rgba(15, 23, 42, 0.4);
  flex-shrink: 0;
}

.sidebar__logout {
  border: none;
  margin-top: 16px;
  padding: 9px 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-badge-error-bg);
  color: var(--color-badge-error-text);
  cursor: pointer;
  font-size: 13px;
}

.sidebar__logout:hover {
  background: rgba(248, 113, 113, 0.18);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 64px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-surface-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__welcome {
  font-size: 13px;
  color: var(--color-text-muted);
}

.topbar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-on-primary);
  font-weight: 600;
  font-size: 14px;
}

.topbar__name {
  font-size: 13px;
  color: var(--color-text-main);
}

.muted {
  color: var(--color-text-muted);
  font-size: 13px;
}

.content {
  padding: 20px 28px 28px;
  overflow-y: auto;
  flex: 1;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 220px 1fr;
  }
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
</style>
