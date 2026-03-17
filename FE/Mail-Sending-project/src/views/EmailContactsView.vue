<template>
  <section class="content__header header-with-actions">
    <div>
      <h1 class="page-title">👥 Email Contacts</h1>
      <p class="page-subtitle">Manage your email contacts and organize them with tags.</p>
    </div>
    <div class="header-buttons">
      <button type="button" class="btn btn--secondary">↑ Import</button>
      <button type="button" class="btn btn--primary">+ Add Contact</button>
    </div>
  </section>

  <section class="content__section">
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Search contacts..." class="search-input" />
      </div>
      <select v-model="filterTag" class="filter-select">
        <option value="">All Tags</option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Status</option>
      </select>
      <button type="button" class="btn btn--primary">Filter</button>
      <button type="button" class="btn btn--secondary">Clear</button>
    </div>

    <div class="card card--table">
      <div class="card__header">
        <h3 class="card__title">👥 Contacts (0)</h3>
        <button type="button" class="btn btn--secondary btn--sm">Bulk Actions ▾</button>
      </div>
      <div class="empty-state-inline">
        <div class="empty-icon">👥</div>
        <h4 class="empty-title">No Contacts Found</h4>
        <p class="empty-desc">Add your first contact to get started</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const filterTag = ref('')
const filterStatus = ref('')
</script>

<style scoped>
.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
.header-buttons {
  display: flex;
  gap: 10px;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: var(--color-control-bg-muted);
  border-radius: 12px;
}
.search-wrap {
  flex: 1;
  min-width: 200px;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.6;
}
.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  box-sizing: border-box;
  background: var(--color-control-bg);
  color: var(--color-text-main);
}
.filter-select {
  padding: 10px 32px 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  background: var(--color-control-bg);
  min-width: 120px;
}
.card--table {
  padding: 24px;
}
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.card__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.btn--sm {
  padding: 8px 14px;
  font-size: 13px;
}
.empty-state-inline {
  text-align: center;
  padding: 48px 24px;
}
.empty-icon {
  font-size: 48px;
  opacity: 0.35;
  margin-bottom: 12px;
}
.empty-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #374151;
}
.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
</style>
