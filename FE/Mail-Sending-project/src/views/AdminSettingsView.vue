<template>
  <section class="content__header">
    <p class="eyebrow">Administration</p>
    <h1 class="page-title">System Settings</h1>
    <p class="page-subtitle">
      Frontend settings for role-aware screens. Wire these to a backend settings API when available.
    </p>
    <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
      {{ notice.message }}
    </p>
  </section>

  <section class="settings-grid">
    <form class="card settings-card" @submit.prevent="saveSettings">
      <h2>Workspace Rules</h2>
      <label class="field">
        <span>Default new account role</span>
        <select v-model="form.defaultRole">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label class="field">
        <span>Admin list default scope</span>
        <select v-model="form.adminDefaultScope">
          <option value="all">All users</option>
          <option value="self">Current admin only</option>
        </select>
      </label>
      <label class="check-row">
        <input v-model="form.requireConfirmDangerActions" type="checkbox" />
        <span>Require confirmation for admin delete/pause actions</span>
      </label>
      <label class="check-row">
        <input v-model="form.showOwnersToAdmins" type="checkbox" />
        <span>Show owner columns on admin lists</span>
      </label>
      <footer class="actions">
        <button type="button" class="btn btn--secondary" @click="resetSettings">
          Reset
        </button>
        <button type="submit" class="btn btn--primary">Save Settings</button>
      </footer>
    </form>

    <article class="card settings-card">
      <h2>Role Policy</h2>
      <dl class="policy-list">
        <div>
          <dt>User</dt>
          <dd>Uses normal routes and receives only owned data from the backend.</dd>
        </div>
        <div>
          <dt>Admin</dt>
          <dd>Uses normal list APIs for system data and `/admin` APIs only for admin actions.</dd>
        </div>
        <div>
          <dt>Dangerous actions</dt>
          <dd>Role changes, user lock/unlock, cross-owner template delete, and campaign pause/delete.</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useNotice } from "../composables/useNotice";

const SETTINGS_KEY = "admin.settings.v1";

const defaults = {
  defaultRole: "user",
  adminDefaultScope: "all",
  requireConfirmDangerActions: true,
  showOwnersToAdmins: true,
};

const notice = useNotice();
const form = reactive({ ...defaults });

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    Object.assign(form, defaults, JSON.parse(raw));
  } catch {
    Object.assign(form, defaults);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(form));
  notice.show("Settings saved in this browser.", "success");
}

function resetSettings() {
  Object.assign(form, defaults);
  localStorage.removeItem(SETTINGS_KEY);
  notice.show("Settings reset.", "success");
}

onMounted(loadSettings);
</script>

<style scoped>
.eyebrow {
  margin: 0 0 6px;
  color: var(--color-accent-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.settings-card {
  border: 1px solid var(--color-border-subtle);
}

.settings-card h2 {
  margin: 0 0 16px;
  color: var(--color-text-main);
  font-size: 17px;
  font-weight: 800;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--color-text-main);
  font-weight: 700;
}

.field select {
  min-height: 44px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  background: var(--color-control-bg);
  color: var(--color-text-main);
  padding: 0 12px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  color: var(--color-text-main);
  font-weight: 700;
}

.actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.policy-list {
  display: grid;
  gap: 14px;
  margin: 0;
}

.policy-list dt {
  color: var(--color-text-main);
  font-weight: 800;
}

.policy-list dd {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
