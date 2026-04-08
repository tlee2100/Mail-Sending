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
        <div class="tag-badge" :style="{ background: `${tag.color}20`, color: tag.color }">
          {{ tag.tag_name }}
        </div>
        <h3 class="tag-title">{{ tag.tag_name }}</h3>
        <p class="tag-desc">Color: {{ tag.color }}</p>
        <div class="tag-meta">
          <span>Created {{ formatDate(tag.created_at) }}</span>
        </div>
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
import { contactsApi } from "../api/contactsApi";
import { ApiClientError } from "../api/http";
import { useNotice } from "../composables/useNotice";
import { auth } from "../stores/auth";

type TagRow = {
  id: number;
  tag_name: string;
  color: string;
  created_at: string;
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

.tag-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.tag-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
}

.tag-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 10px;
}

.tag-meta {
  font-size: 12px;
  color: #9ca3af;
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
