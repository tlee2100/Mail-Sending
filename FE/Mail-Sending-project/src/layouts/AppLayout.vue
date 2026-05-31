<template>
  <div class="layout">
    <aside class="sidebar">
      <RouterLink to="/" class="sidebar__brand">
        <div class="brand__logo">CM</div>
        <div class="brand__text">
          <div class="brand__name">ChadMailer</div>
          <div class="brand__subtitle">Professional Email Marketing</div>
        </div>
      </RouterLink>

      <nav class="sidebar__nav">
        <div class="nav__section">
          <div class="nav__title">Main Menu</div>
          <RouterLink to="/" class="nav__item" exact-active-class="nav__item--active">
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
            v-if="isAdmin"
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
            v-if="isAdmin"
            to="/payment"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">💳</span>
            <span>Payment Integration</span>
          </RouterLink>
        </div>

        <div v-if="isAdmin" class="nav__section">
          <div class="nav__title">Admin</div>
          <RouterLink
            to="/admin/dashboard"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">AD</span>
            <span>Admin Dashboard</span>
          </RouterLink>
          <RouterLink
            to="/admin/users"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">US</span>
            <span>User Management</span>
          </RouterLink>
          <RouterLink
            to="/admin/audit-logs"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">LG</span>
            <span>Audit Logs</span>
          </RouterLink>
          <RouterLink
            to="/admin/settings"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">ST</span>
            <span>System Settings</span>
          </RouterLink>
        </div>

        <div class="nav__section">
          <div class="nav__title">Account</div>
          <RouterLink
            to="/usage"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">QT</span>
            <span>Usage & Limits</span>
          </RouterLink>
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
        <RouterLink to="/" class="topbar__mobile-brand">
          <div class="brand__logo brand__logo--small">CM</div>
          <span>ChadMailer</span>
        </RouterLink>
        <div class="topbar__breadcrumb">
          <span class="muted">{{ breadcrumb }}</span>
        </div>
        <div class="topbar__right">
          <button class="theme-toggle" type="button" @click="toggleTheme">
            <span v-if="isDark">🌙 Dark</span>
            <span v-else>☀️ Light</span>
          </button>
          <span class="topbar__welcome">Welcome back</span>
          <div class="topbar__avatar">{{ userInitial }}</div>
          <span class="topbar__name">{{ displayName }}</span>
          <span class="topbar__role">{{ roleLabel }}</span>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>

      <nav class="mobile-nav" aria-label="Mobile navigation">
        <RouterLink to="/" class="mobile-nav__item" exact-active-class="mobile-nav__item--active">
          <span class="mobile-nav__icon">DB</span>
          <span>Home</span>
        </RouterLink>
        <RouterLink
          to="/individual-emails"
          class="mobile-nav__item"
          active-class="mobile-nav__item--active"
        >
          <span class="mobile-nav__icon">SD</span>
          <span>Send</span>
        </RouterLink>
        <RouterLink
          to="/campaigns"
          class="mobile-nav__item"
          active-class="mobile-nav__item--active"
        >
          <span class="mobile-nav__icon">CP</span>
          <span>Campaigns</span>
        </RouterLink>
        <RouterLink
          to="/email-contacts"
          class="mobile-nav__item"
          active-class="mobile-nav__item--active"
        >
          <span class="mobile-nav__icon">CT</span>
          <span>Contacts</span>
        </RouterLink>
        <RouterLink
          v-if="isAdmin"
          to="/admin/dashboard"
          class="mobile-nav__item"
          active-class="mobile-nav__item--active"
        >
          <span class="mobile-nav__icon">AD</span>
          <span>Admin</span>
        </RouterLink>
        <RouterLink
          to="/contact-tags"
          class="mobile-nav__item"
          active-class="mobile-nav__item--active"
        >
          <span class="mobile-nav__icon">TG</span>
          <span>Tags</span>
        </RouterLink>
      </nav>
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
const displayName = computed(() => auth.state.user?.name || "User");
const userInitial = computed(() =>
  displayName.value.trim().slice(0, 1).toUpperCase(),
);
const isAdmin = computed(() => auth.state.user?.role === "admin");
const roleLabel = computed(() => (isAdmin.value ? "Admin" : "User"));

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
  background: var(--color-transparent);
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
}

.theme-toggle:hover {
  background: var(--color-sidebar-hover);
}
</style>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
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
  border-bottom: 1px solid var(--color-sidebar-border);
  margin-bottom: 16px;
  color: inherit;
  text-decoration: none;
}

.brand__logo {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.brand__logo--small {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  font-size: 13px;
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
  background: var(--color-transparent);
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
  background: var(--color-sidebar-active);
}

.nav__item--active {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-primary-soft)
  );
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18);
}

.nav__item--active .nav__icon {
  background: var(--color-control-hover-dark);
}

.nav__icon {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: var(--color-overlay-soft);
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
  background: var(--color-badge-error-bg-strong);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg-surface);
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

.topbar__mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  color: var(--color-text-main);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
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

.topbar__role {
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--color-primary-bg-active);
  color: var(--color-primary-text);
  font-size: 11px;
  font-weight: 700;
}

.muted {
  color: var(--color-text-muted);
  font-size: 13px;
}

.content {
  padding: 20px 28px 28px;
  overflow-y: auto;
  flex: 1;
  background: var(--color-bg-surface);
}

.mobile-nav {
  display: none;
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

  .main {
    min-height: 100vh;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    height: 58px;
    padding: 0 14px;
  }

  .topbar__mobile-brand {
    display: flex;
  }

  .topbar__breadcrumb,
  .topbar__welcome,
  .topbar__name,
  .topbar__role {
    display: none;
  }

  .topbar__right {
    gap: 8px;
  }

  .theme-toggle {
    margin-right: 2px;
    padding: 6px 9px;
  }

  .topbar__avatar {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .content {
    padding: 16px 14px 92px;
  }

  .mobile-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--color-border-subtle);
    border-radius: 18px;
    background: var(--color-surface-mobile);
    box-shadow: 0 18px 50px var(--shadow-mobile-nav-color);
    backdrop-filter: blur(14px);
  }

  body.dark-mode .mobile-nav {
    background: var(--color-bg-sidebar-soft);
  }

  .mobile-nav__item {
    min-width: 0;
    min-height: 54px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: 14px;
    color: var(--color-text-muted);
    font-size: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .mobile-nav__icon {
    width: 26px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--color-control-bg-muted);
    color: var(--color-text-main);
    font-size: 10px;
  }

  .mobile-nav__item--active {
    background: var(--color-primary-bg-hover);
    color: var(--color-primary);
  }

  .mobile-nav__item--active .mobile-nav__icon {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-soft));
    color: var(--color-text-on-primary);
  }
}
</style>
