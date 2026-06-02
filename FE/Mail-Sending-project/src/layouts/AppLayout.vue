<template>
  <div class="layout">
    <div class="layout__glow layout__glow--one"></div>
    <div class="layout__glow layout__glow--two"></div>
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
            <span class="nav__icon">DB</span>
            <span>Dashboard</span>
          </RouterLink>
          <RouterLink
            to="/instant-campaign"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">IC</span>
            <span>Instant Campaign</span>
          </RouterLink>
          <RouterLink
            to="/individual-emails"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">EM</span>
            <span>Individual Emails</span>
          </RouterLink>
          <RouterLink
            to="/email-templates"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">TP</span>
            <span>Email Templates</span>
          </RouterLink>
          <RouterLink
            to="/email-contacts"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">CT</span>
            <span>Email Contacts</span>
          </RouterLink>
          <RouterLink
            to="/contact-tags"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">TG</span>
            <span>Contact Tags</span>
          </RouterLink>
          <RouterLink
            to="/campaigns"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">CP</span>
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
            <span class="nav__icon">IM</span>
            <span>Import / Export</span>
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            to="/contacts/fields"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">FL</span>
            <span>Contact Fields</span>
          </RouterLink>
          <RouterLink
            to="/templates/designer"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">DS</span>
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
            <span class="nav__icon">SM</span>
            <span>Email Accounts</span>
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            to="/payment"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">PY</span>
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
            <span class="nav__icon">PF</span>
            <span>Profile</span>
          </RouterLink>
          <RouterLink
            to="/security"
            class="nav__item"
            active-class="nav__item--active"
          >
            <span class="nav__icon">SC</span>
            <span>Security</span>
          </RouterLink>
        </div>
      </nav>

      <button class="sidebar__logout" @click="handleLogout">
        <span class="nav__icon">LO</span>
        <span>Logout</span>
      </button>
    </aside>

    <div class="main">
      <header class="topbar">
        <button
          class="topbar__menu-button"
          :class="{ 'topbar__menu-button--active': mobileMenuOpen }"
          type="button"
          aria-label="Open navigation menu"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <RouterLink to="/" class="topbar__mobile-brand">
          <div class="brand__logo brand__logo--small">CM</div>
          <span>ChadMailer</span>
        </RouterLink>
        <div class="topbar__breadcrumb">
          <span class="muted">{{ breadcrumb }}</span>
        </div>
        <div class="topbar__right">
          <button class="theme-toggle" type="button" @click="toggleTheme">
            <span v-if="isDark">Dark</span>
            <span v-else>Light</span>
          </button>
          <span class="topbar__pulse">Live SMTP</span>
          <span class="topbar__welcome">Welcome back</span>
          <div class="topbar__avatar">{{ userInitial }}</div>
          <span class="topbar__name">{{ displayName }}</span>
          <span class="topbar__role">{{ roleLabel }}</span>
        </div>
        <div class="topbar__mobile-title">
          <strong>{{ breadcrumb }}</strong>
          <span>{{ userEmail }}</span>
        </div>
        <nav v-if="mobileMenuOpen" class="mobile-menu" aria-label="Mobile menu">
          <RouterLink
            v-for="link in mobileMenuLinks"
            :key="link.to"
            :to="link.to"
            class="mobile-menu__item"
            :class="{ 'mobile-menu__item--active': isMobileLinkActive(link) }"
            @click="closeMobileMenu"
          >
            <span class="mobile-menu__icon">{{ link.icon }}</span>
            <span>{{ link.label }}</span>
            <span v-if="isMobileLinkActive(link)" class="mobile-menu__dot"></span>
          </RouterLink>
          <button type="button" class="mobile-menu__logout" @click="handleMobileLogout">
            <span class="mobile-menu__icon">LO</span>
            <span>Logout</span>
          </button>
        </nav>
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
import { computed, onMounted, ref, watch } from "vue";
import { auth } from "../stores/auth";

const route = useRoute();
const router = useRouter();
type MobileMenuLink = {
  to: string;
  icon: string;
  label: string;
  exact?: boolean;
};

const breadcrumb = computed(
  () => (route.meta.breadcrumb as string) || "Dashboard",
);
const displayName = computed(() => auth.state.user?.name || "User");
const userEmail = computed(() => auth.state.user?.email || "Account");
const userInitial = computed(() =>
  displayName.value.trim().slice(0, 1).toUpperCase(),
);
const isAdmin = computed(() => auth.state.user?.role === "admin");
const roleLabel = computed(() => (isAdmin.value ? "Admin" : "User"));

const isDark = ref(false);
const mobileMenuOpen = ref(false);

const mobileMenuLinks = computed<MobileMenuLink[]>(() => {
  const links: MobileMenuLink[] = [
    { to: "/", icon: "DB", label: "Dashboard", exact: true },
    { to: "/individual-emails", icon: "SD", label: "Send" },
    { to: "/campaigns", icon: "CP", label: "Campaigns" },
    { to: "/email-templates", icon: "TP", label: "Templates" },
    { to: "/templates/designer", icon: "DS", label: "Designer" },
    { to: "/email-contacts", icon: "CT", label: "Contacts" },
    { to: "/contact-tags", icon: "TG", label: "Tags" },
    { to: "/email-accounts", icon: "SM", label: "SMTP Accounts" },
    { to: "/usage", icon: "QT", label: "Usage" },
    { to: "/profile", icon: "PF", label: "Profile" },
    { to: "/security", icon: "SC", label: "Security" },
  ];

  if (isAdmin.value) {
    links.push(
      { to: "/admin/dashboard", icon: "AD", label: "Admin" },
      { to: "/admin/users", icon: "US", label: "Users" },
      { to: "/admin/audit-logs", icon: "LG", label: "Audit Logs" },
      { to: "/admin/settings", icon: "ST", label: "Settings" },
    );
  }

  return links;
});

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

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

function isMobileLinkActive(link: MobileMenuLink) {
  if (link.exact) {
    return route.path === link.to;
  }
  return route.path === link.to || route.path.startsWith(`${link.to}/`);
}

onMounted(() => {
  loadInitialTheme();
});

async function handleLogout() {
  await auth.logout();
  router.push({ name: "login" });
}

async function handleMobileLogout() {
  closeMobileMenu();
  await handleLogout();
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  },
);
</script>

<style scoped>
.theme-toggle {
  margin-right: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: linear-gradient(135deg, var(--color-primary-bg-soft), var(--color-info-bg-muted));
  color: var(--color-primary-text);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-control);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.theme-toggle:hover {
  border-color: var(--color-primary-border-muted);
  box-shadow: 0 14px 26px var(--shadow-primary-soft-color);
  transform: translateY(-1px);
}
</style>

<style scoped>
.layout {
  position: relative;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background:
    radial-gradient(circle at 30% -12%, rgba(14, 165, 233, 0.06), transparent 32%),
    radial-gradient(circle at 94% 10%, rgba(236, 72, 153, 0.05), transparent 28%),
    linear-gradient(135deg, var(--color-bg-surface), var(--color-bg-surface-tinted));
  color: var(--color-text-main);
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "SF Pro Text",
    sans-serif;
  overflow: hidden;
}

.layout__glow {
  position: fixed;
  z-index: 0;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  filter: blur(8px);
  opacity: 0.18;
  pointer-events: none;
  animation: floatGlow 9s ease-in-out infinite;
}

.layout__glow--one {
  top: 90px;
  left: 220px;
  background: radial-gradient(circle, var(--color-mail-glow), transparent 66%);
}

.layout__glow--two {
  right: -110px;
  bottom: 12%;
  background: radial-gradient(circle, var(--color-campaign-glow), transparent 66%);
  animation-delay: -3s;
}

.sidebar {
  position: relative;
  z-index: 2;
  background: var(--gradient-sidebar);
  color: var(--color-text-on-dark);
  display: flex;
  flex-direction: column;
  padding: 20px 18px;
  border-right: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 10px 0 34px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.sidebar::before,
.sidebar::after {
  content: "";
  position: absolute;
  inset: auto;
  pointer-events: none;
}

.sidebar::before {
  top: -90px;
  right: -90px;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.12), transparent 68%);
}

.sidebar::after {
  left: 24px;
  right: 24px;
  bottom: 86px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.34), transparent);
}

.sidebar__brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 18px;
  border-bottom: 1px solid var(--color-sidebar-border);
  margin-bottom: 16px;
  color: inherit;
  text-decoration: none;
}

.brand__logo {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: var(--gradient-campaign);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--color-text-on-solid);
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.18);
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
  letter-spacing: 0;
}

.brand__subtitle {
  font-size: 11px;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sidebar__nav {
  position: relative;
  z-index: 1;
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
  font-weight: 800;
}

.nav__item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
  text-decoration: none;
  margin-bottom: 4px;
  box-sizing: border-box;
}

.nav__item:hover {
  background: rgba(255, 255, 255, 0.11);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateX(3px);
}

.nav__item--active {
  background: var(--gradient-campaign);
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.14);
}

.nav__item--active .nav__icon {
  background: var(--color-control-hover-dark);
}

.nav__icon {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  letter-spacing: 0;
}

.sidebar__logout {
  position: relative;
  z-index: 1;
  border: none;
  margin-top: 16px;
  padding: 9px 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(249, 115, 22, 0.16));
  color: var(--color-badge-error-text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.sidebar__logout:hover {
  background: var(--color-badge-error-bg-strong);
  transform: translateY(-1px);
}

.main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: transparent;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  height: 64px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(10px);
}

:global(body.dark-mode) .topbar {
  background: rgba(2, 6, 23, 0.72);
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

.topbar__menu-button,
.topbar__mobile-title,
.mobile-menu {
  display: none;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__pulse {
  position: relative;
  padding: 6px 10px 6px 24px;
  border-radius: 999px;
  background: var(--color-success-bg-soft);
  color: var(--color-success-text);
  font-size: 12px;
  font-weight: 800;
}

.topbar__pulse::before {
  content: "";
  position: absolute;
  left: 10px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.42);
  transform: translateY(-50%);
  animation: pulseDot 1.8s ease-out infinite;
}

.topbar__welcome {
  font-size: 13px;
  color: var(--color-text-muted);
}

.topbar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--gradient-campaign);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-on-primary);
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 7px 14px rgba(124, 58, 237, 0.16);
}

.topbar__name {
  font-size: 13px;
  color: var(--color-text-main);
}

.topbar__role {
  padding: 4px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-primary-bg-active), var(--color-info-bg-subtle));
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
  background: transparent;
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
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px 12px;
    height: auto;
    min-height: 104px;
    padding: max(env(safe-area-inset-top), 10px) 16px 12px;
    align-items: center;
    overflow: visible;
  }

  .topbar__menu-button {
    width: 44px;
    height: 44px;
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--color-control-bg-muted);
    color: var(--color-text-main);
    cursor: pointer;
    box-shadow: var(--shadow-control);
  }

  .topbar__menu-button span {
    width: 18px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
    transition:
      transform 0.18s ease,
      opacity 0.18s ease;
  }

  .topbar__menu-button--active span:first-child {
    transform: translateY(6px) rotate(45deg);
  }

  .topbar__menu-button--active span:nth-child(2) {
    opacity: 0;
  }

  .topbar__menu-button--active span:last-child {
    transform: translateY(-6px) rotate(-45deg);
  }

  .topbar__mobile-brand {
    display: flex;
    min-width: 0;
  }

  .topbar__mobile-brand span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .topbar__breadcrumb,
  .topbar__welcome,
  .topbar__name,
  .topbar__role {
    display: none;
  }

  .topbar__right {
    gap: 8px;
    justify-self: end;
  }

  .theme-toggle {
    margin-right: 2px;
    padding: 6px 9px;
  }

  .topbar__pulse {
    display: none;
  }

  .topbar__avatar {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .topbar__mobile-title {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
  }

  .topbar__mobile-title strong {
    color: var(--color-text-strong);
    font-size: 20px;
    font-weight: 900;
    line-height: 1.15;
  }

  .topbar__mobile-title span {
    max-width: 100%;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-menu {
    position: absolute;
    left: 16px;
    right: 16px;
    top: calc(100% + 8px);
    z-index: 40;
    display: grid;
    gap: 6px;
    max-height: min(70vh, 560px);
    overflow-y: auto;
    padding: 10px;
    border: 1px solid var(--color-border-subtle);
    border-radius: 18px;
    background: var(--color-surface-mobile);
    box-shadow: var(--shadow-mobile-nav);
    backdrop-filter: blur(16px);
  }

  :global(body.dark-mode) .mobile-menu {
    background: var(--color-bg-sidebar-soft);
  }

  .mobile-menu__item,
  .mobile-menu__logout {
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: 800;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .mobile-menu__item--active {
    background: var(--color-primary-bg-hover);
    color: var(--color-primary);
  }

  .mobile-menu__icon {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-control-bg-muted);
    color: var(--color-text-main);
    font-size: 10px;
    font-weight: 900;
  }

  .mobile-menu__item--active .mobile-menu__icon {
    background: var(--color-primary);
    color: var(--color-text-on-primary);
  }

  .mobile-menu__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--color-primary);
  }

  .mobile-menu__logout {
    margin-top: 4px;
    color: var(--color-danger-text);
    background: var(--color-danger-bg-subtle);
  }

  .content {
    padding: 16px 14px calc(18px + env(safe-area-inset-bottom));
  }

  .mobile-nav {
    display: none;
  }
}

@keyframes floatGlow {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(24px, -18px, 0) scale(1.08);
  }
}

@keyframes pulseDot {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.42);
  }

  100% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
}
</style>
