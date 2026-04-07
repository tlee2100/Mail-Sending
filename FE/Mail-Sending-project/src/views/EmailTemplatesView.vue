<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">
        <span class="title-icon">Tpl</span> Saved Email Templates
      </h1>
      <p class="page-subtitle">
        Create, manage and reuse your email templates for instant campaigns.
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="createTemplate">
      + Create Template
    </button>
  </section>

  <section class="content__section quick-links">
    <RouterLink :to="designerTarget" class="btn btn--secondary">Open Designer</RouterLink>
    <RouterLink :to="versionsTarget" class="btn btn--secondary">Open Versions</RouterLink>
  </section>

  <section class="grid grid--stats-three">
    <div class="card card--stat-tpl card--blue">
      <span class="card__icon">Tpl</span>
      <span class="card__value">{{ templates.length }}</span>
      <span class="card__label">Total Templates</span>
    </div>
    <div class="card card--stat-tpl card--green">
      <span class="card__icon">Top</span>
      <span class="card__value">{{ mostUsedTemplate }}</span>
      <span class="card__label">Most Used</span>
    </div>
    <div class="card card--stat-tpl card--cyan">
      <span class="card__icon">New</span>
      <span class="card__value">{{ recentTemplate }}</span>
      <span class="card__label">Recent Updates</span>
    </div>
  </section>

  <section class="content__section">
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">Find</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="search-input"
        />
      </div>
      <select v-model="sortBy" class="sort-select">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name">Name</option>
      </select>
    </div>

    <div class="grid grid--samples">
      <RouterLink
        v-for="item in filteredTemplates"
        :key="item.id"
        :to="`/templates/${item.id}/designer?sample=${item.sample}`"
        class="card sample-card"
      >
        <div class="sample-card__top">
          <h3 class="sample-card__title">{{ item.name }}</h3>
          <span class="sample-card__badge">{{ item.category }}</span>
        </div>
        <p class="sample-card__desc">{{ item.description }}</p>
        <span class="sample-card__cta">
          Open in Designer · {{ mockWorkspace.formatRelativeTime(item.updatedAt) }}
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace } from "../stores/mockWorkspace";

const router = useRouter();
const notice = useNotice();
const searchQuery = ref("");
const sortBy = ref("newest");

const templates = computed(() => mockWorkspace.state.templates);
const designerTarget = computed(() => {
  const current = templates.value[0];
  return current ? `/templates/${current.id}/designer?sample=${current.sample}` : "/templates/1/designer";
});
const versionsTarget = computed(() => {
  const current = templates.value[0];
  return current ? `/templates/${current.id}/designer/versions` : "/templates/1/designer/versions";
});
const mostUsedTemplate = computed(() => {
  const current = [...templates.value].sort((a, b) => b.useCount - a.useCount)[0];
  return current?.name || "None";
});
const recentTemplate = computed(() => templates.value[0]?.name || "None");
const filteredTemplates = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const next = templates.value.filter((item) => {
    return (
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });

  return [...next].sort((a, b) => {
    if (sortBy.value === "name") return a.name.localeCompare(b.name);
    if (sortBy.value === "oldest") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
});

function createTemplate() {
  const name = window.prompt("Template name", "Launch Announcement");
  if (!name?.trim()) return;
  const category = window.prompt("Template category", "Product") || "General";
  const description =
    window.prompt("Short description", "Reusable campaign template") ||
    "Reusable campaign template";
  const template = mockWorkspace.addTemplate({ name, category, description });
  notice.show(`Template "${template.name}" created.`, "success");
  router.push(`/templates/${template.id}/designer?sample=${template.sample}`);
}
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
  font-size: 12px;
  font-weight: 700;
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
  font-size: 18px;
  font-weight: 700;
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
  font-size: 12px;
  font-weight: 700;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 48px;
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

.grid--samples {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.sample-card {
  border: 1px solid var(--color-border-subtle);
  text-decoration: none;
  color: var(--color-text-main);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.sample-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.sample-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.sample-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.sample-card__badge {
  border: 1px solid var(--color-border-subtle);
  border-radius: 999px;
  background: var(--color-control-bg-muted);
  color: var(--color-text-muted);
  font-size: 11px;
  padding: 4px 8px;
}

.sample-card__desc {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.sample-card__cta {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
}

.quick-links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .grid--stats-three {
    grid-template-columns: 1fr;
  }
}
</style>
