<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Saved Email Templates</h1>
      <p class="page-subtitle">Templates loaded from backend</p>
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
      <span class="card__icon">Act</span>
      <span class="card__value">{{ activeCount }}</span>
      <span class="card__label">Active Templates</span>
    </div>
    <div class="card card--stat-tpl card--cyan">
      <span class="card__icon">New</span>
      <span class="card__value">{{ latestTemplateName }}</span>
      <span class="card__label">Latest Template</span>
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
    </div>

    <div class="grid grid--samples" v-if="filteredTemplates.length">
      <RouterLink
        v-for="item in filteredTemplates"
        :key="item.id"
        :to="`/templates/${item.id}/designer`"
        class="card sample-card"
      >
        <div class="sample-card__top">
          <h3 class="sample-card__title">{{ item.template_name }}</h3>
          <span class="sample-card__badge">{{ item.is_active ? "Active" : "Inactive" }}</span>
        </div>
        <p class="sample-card__desc">{{ item.preview_text || item.subject || "No preview text" }}</p>
        <span class="sample-card__cta">Open in Designer</span>
      </RouterLink>
    </div>
    <div v-else class="card">
      <p>No templates found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { templatesApi } from "../api/templatesApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type TemplateRow = {
  id: number;
  template_name: string;
  subject?: string | null;
  preview_text?: string | null;
  is_active: boolean;
};

const router = useRouter();
const notice = useNotice();
const templates = ref<TemplateRow[]>([]);
const searchQuery = ref("");

const filteredTemplates = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return templates.value.filter((item) => {
    return (
      !query ||
      item.template_name.toLowerCase().includes(query) ||
      String(item.subject || "").toLowerCase().includes(query) ||
      String(item.preview_text || "").toLowerCase().includes(query)
    );
  });
});

const activeCount = computed(() => templates.value.filter((item) => item.is_active).length);
const latestTemplateName = computed(() => templates.value[0]?.template_name || "None");
const designerTarget = computed(() => {
  const current = templates.value[0];
  return current ? `/templates/${current.id}/designer` : "/templates/1/designer";
});
const versionsTarget = computed(() => {
  const current = templates.value[0];
  return current ? `/templates/${current.id}/designer/versions` : "/templates/1/designer/versions";
});

async function loadTemplates() {
  if (!auth.state.token) return;
  try {
    const response = await templatesApi.listTemplates(auth.state.token);
    templates.value = response.data.items as TemplateRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load templates";
    notice.show(message, "error");
  }
}

async function createTemplate() {
  if (!auth.state.token) return;
  const templateName = window.prompt("Template name", "Launch Announcement");
  if (!templateName?.trim()) return;
  const subject = window.prompt("Subject", "New update for you") || undefined;
  const previewText = window.prompt("Preview text", "Short preview") || undefined;

  try {
    const response = await templatesApi.createTemplate(auth.state.token, {
      templateName: templateName.trim(),
      subject,
      previewText,
      contentHtml: "<p>Hello from template</p>",
      contentText: "Hello from template",
      isActive: true,
    });
    const id = Number(response.data.id);
    notice.show("Template created.", "success");
    await loadTemplates();
    router.push(`/templates/${id}/designer`);
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to create template";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadTemplates();
});
</script>

<style scoped>
.header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
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

.card--blue { background: #4a90e2; }
.card--green { background: #50e3c2; color: #0f766e; }
.card--cyan { background: #00bcd4; color: #0c4a6e; }

.card--stat-tpl .card__icon { font-size: 18px; font-weight: 700; }
.card--stat-tpl .card__value { font-size: 28px; font-weight: 700; }
.card--stat-tpl .card__label { font-size: 13px; opacity: 0.95; color: inherit; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.search-wrap { flex: 1; position: relative; }
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  font-size: 12px; font-weight: 700; opacity: 0.6;
}
.search-input {
  width: 100%; padding: 10px 12px 10px 48px; border-radius: 10px;
  border: 1px solid var(--color-border-subtle); font-size: 14px; box-sizing: border-box;
  background: var(--color-control-bg); color: var(--color-text-main);
}

.grid--samples { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.sample-card {
  border: 1px solid var(--color-border-subtle);
  text-decoration: none;
  color: var(--color-text-main);
}
.sample-card__top {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;
}
.sample-card__title { margin: 0; font-size: 15px; font-weight: 600; }
.sample-card__badge {
  border: 1px solid var(--color-border-subtle);
  border-radius: 999px;
  background: var(--color-control-bg-muted);
  color: var(--color-text-muted);
  font-size: 11px;
  padding: 4px 8px;
}
.sample-card__desc { margin: 0 0 14px; font-size: 13px; color: var(--color-text-muted); }
.sample-card__cta { color: var(--color-primary); font-size: 12px; font-weight: 600; }
.quick-links { display: flex; gap: 10px; flex-wrap: wrap; }

@media (max-width: 768px) {
  .grid--stats-three { grid-template-columns: 1fr; }
}
</style>
