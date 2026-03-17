<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title"><span class="title-icon">📄</span> Saved Email Templates</h1>
      <p class="page-subtitle">Create, manage and reuse your email templates for instant campaigns.</p>
    </div>
    <button type="button" class="btn btn--primary">+ Create Template</button>
  </section>

  <section class="grid grid--stats-three">
    <div class="card card--stat-tpl card--blue">
      <span class="card__icon">📄</span>
      <span class="card__value">0</span>
      <span class="card__label">Total Templates</span>
    </div>
    <div class="card card--stat-tpl card--green">
      <span class="card__icon">✓</span>
      <span class="card__value">None</span>
      <span class="card__label">Most Used</span>
    </div>
    <div class="card card--stat-tpl card--cyan">
      <span class="card__icon">📈</span>
      <span class="card__value">None</span>
      <span class="card__label">Recent Updates</span>
    </div>
  </section>

  <section class="content__section">
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Search templates..." class="search-input" />
      </div>
      <select v-model="sortBy" class="sort-select">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name">Name</option>
      </select>
    </div>

    <div class="card card--empty-state">
      <div class="empty-icon">📄</div>
      <h3 class="empty-title">No Email Templates Found</h3>
      <p class="empty-desc">Create your first email template to get started with professional email campaigns.</p>
      <button type="button" class="btn btn--primary">+ Create Your First Template</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const sortBy = ref('newest')
</script>

<style scoped>
.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(79, 70, 229, 0.14);
  margin-right: 8px;
}
.grid--stats-three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 24px;
}
.card--stat-tpl {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: white;
  padding: 20px;
}
.card--stat-tpl .card__icon {
  font-size: 24px;
  opacity: 0.9;
}
.card--stat-tpl .card__value {
  font-size: 28px;
  font-weight: 700;
}
.card--stat-tpl .card__label {
  font-size: 13px;
  opacity: 0.95;
  color: inherit;
}
.card--blue {
  background: #4a90e2;
}
.card--green {
  background: #50e3c2;
  color: #0f766e;
}
.card--cyan {
  background: #00bcd4;
  color: #0c4a6e;
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-wrap {
  flex: 1;
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
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  box-sizing: border-box;
  background: var(--color-control-bg);
  color: var(--color-text-main);
}
.sort-select {
  padding: 10px 36px 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  font-size: 14px;
  background: var(--color-control-bg);
  min-width: 160px;
}
.card--empty-state {
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed #d1d5db;
  background: #fafafa;
}
.empty-icon {
  font-size: 64px;
  opacity: 0.4;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #111827;
}
.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
}
@media (max-width: 768px) {
  .grid--stats-three {
    grid-template-columns: 1fr;
  }
}
</style>
