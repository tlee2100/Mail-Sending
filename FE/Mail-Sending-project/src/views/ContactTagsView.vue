<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Contact Tags</h1>
      <p class="page-subtitle">Tags loaded from backend</p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="createTag">
      + Create Tag
    </button>
  </section>

  <section class="content__section">
    <div class="grid grid--tags" v-if="tags.length">
      <div v-for="tag in tags" :key="tag.id" class="card card--tag">
        <div class="tag-card-head">
          <div class="tag-badge" :style="{ background: `${tag.color}20`, color: tag.color }">
            {{ tag.tag_name }}
          </div>
          <span class="tag-dot" :style="{ background: tag.color }"></span>
        </div>
        <h3 class="tag-title">{{ tag.tag_name }}</h3>
        <p class="tag-count">{{ tag.contact_count || 0 }}</p>
        <p class="tag-desc">Contacts in this audience segment</p>
        <div class="tag-meta">
          <span>Created {{ formatDate(tag.created_at) }}</span>
        </div>
        <RouterLink
          class="btn btn--secondary btn--wide"
          :to="{ name: 'email-contacts', query: { tagId: tag.id } }"
        >
          View Contacts
        </RouterLink>
      </div>
    </div>
    <div class="card card--cta" v-else>
      <h3 class="cta-title">No tags found</h3>
      <p class="cta-desc">Create your first backend tag to organize contacts.</p>
      <button type="button" class="btn btn--primary btn--lg" @click="createTag">
        + Create Tag
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type TagRow = {
  id: number;
  tag_name: string;
  color: string;
  created_at: string;
  contact_count?: number;
};

const notice = useNotice();
const tags = ref<TagRow[]>([]);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadTags() {
  if (!auth.state.token) return;
  try {
    const response = await contactsApi.listTags(auth.state.token);
    tags.value = response.data as TagRow[];
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to load tags";
    notice.show(message, "error");
  }
}

async function createTag() {
  if (!auth.state.token) return;
  const tagName = window.prompt("Tag name", "VIP");
  if (!tagName?.trim()) return;
  const color = window.prompt("Hex color", "#4f46e5") || "#4f46e5";

  try {
    await contactsApi.createTag(auth.state.token, {
      tagName: tagName.trim(),
      color,
    });
    notice.show("Tag created.", "success");
    await loadTags();
  } catch (error) {
    const message =
      error instanceof ApiClientError ? error.message : "Failed to create tag";
    notice.show(message, "error");
  }
}

onMounted(() => {
  void loadTags();
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

.grid--tags {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.card--tag {
  padding: 20px;
  position: relative;
}

.tag-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.tag-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.tag-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
}

.tag-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
}

.tag-count {
  margin: 10px 0 2px;
  font-size: 36px;
  line-height: 1;
  font-weight: 800;
  color: var(--color-text-main);
}

.tag-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 10px;
}

.tag-meta {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.btn--wide {
  width: 100%;
  justify-content: center;
}

.card--cta {
  padding: 32px;
  text-align: center;
}

.cta-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px;
}

.cta-desc {
  color: #6b7280;
  margin: 0 0 20px;
}

.btn--lg {
  padding: 12px 24px;
  font-size: 15px;
}
</style>
