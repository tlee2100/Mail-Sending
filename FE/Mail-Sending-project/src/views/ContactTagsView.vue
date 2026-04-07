<template>
  <section class="content__header header-with-action">
    <div>
      <h1 class="page-title">Contact Tags</h1>
      <p class="page-subtitle">
        Organize and categorize your contacts with custom tags.
      </p>
      <p v-if="notice.message" class="notice" :class="`notice--${notice.tone}`">
        {{ notice.message }}
      </p>
    </div>
    <button type="button" class="btn btn--primary" @click="createTag">
      + Create Tag
    </button>
  </section>

  <section class="content__section">
    <div class="grid grid--tags">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="card card--tag"
        :class="`card--tag-${tag.color}`"
      >
        <div class="tag-badge" :class="`tag-badge--${tag.color}`">{{ tag.name }}</div>
        <div class="tag-icon-wrap" :class="`tag-icon-wrap--${tag.color}`">Tag</div>
        <h3 class="tag-title">{{ tag.name }}</h3>
        <p class="tag-desc">{{ tag.description }}</p>
        <div class="tag-meta">
          <span>{{ countContacts(tag.id) }} contacts</span>
          <span>Created {{ mockWorkspace.formatRelativeTime(tag.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div class="card card--cta">
      <div class="cta-icon">Tag</div>
      <h3 class="cta-title">Organize Better with Tags</h3>
      <p class="cta-desc">
        Tags help you segment your contacts for targeted email campaigns.
      </p>
      <button type="button" class="btn btn--primary btn--lg" @click="createTag">
        + Create Your First Tag
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useNotice } from "../composables/useNotice";
import { mockWorkspace, type MockTagColor } from "../stores/mockWorkspace";

const notice = useNotice();
const tags = computed(() => mockWorkspace.state.tags);

function createTag() {
  const name = window.prompt("Tag name", "VIP Prospects");
  if (!name?.trim()) return;
  const description =
    window.prompt("Tag description", "Contacts prioritized for next outreach") ||
    "";
  const color =
    (window.prompt("Tag color: blue, green, yellow, purple, red, cyan", "blue") ||
      "blue") as MockTagColor;
  const safeColor: MockTagColor = [
    "blue",
    "green",
    "yellow",
    "purple",
    "red",
    "cyan",
  ].includes(color)
    ? color
    : "blue";
  const tag = mockWorkspace.addTag({
    name,
    description,
    color: safeColor,
  });
  notice.show(`Tag "${tag.name}" created.`, "success");
}

function countContacts(tagId: string) {
  return mockWorkspace.state.contacts.filter((contact) =>
    contact.tags.includes(tagId),
  ).length;
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

.grid--tags {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.card--tag {
  padding: 20px;
  position: relative;
}

.tag-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.tag-badge--blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.tag-badge--green {
  background: #dcfce7;
  color: #15803d;
}

.tag-badge--yellow {
  background: #fef9c3;
  color: #a16207;
}

.tag-badge--purple {
  background: #f3e8ff;
  color: #7c3aed;
}

.tag-badge--red {
  background: #fee2e2;
  color: #b91c1c;
}

.tag-badge--cyan {
  background: #cffafe;
  color: #0f766e;
}

.tag-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.tag-icon-wrap--blue {
  background: #dbeafe;
}

.tag-icon-wrap--green {
  background: #dcfce7;
}

.tag-icon-wrap--yellow {
  background: #fef9c3;
}

.tag-icon-wrap--purple {
  background: #f3e8ff;
}

.tag-icon-wrap--red {
  background: #fee2e2;
}

.tag-icon-wrap--cyan {
  background: #cffafe;
}

.tag-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #111827;
}

.tag-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 14px;
  line-height: 1.4;
}

.tag-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.card--cta {
  padding: 40px 32px;
  text-align: center;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #e9d5ff;
}

.cta-icon {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  opacity: 0.8;
}

.cta-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: #1f2937;
}

.cta-desc {
  font-size: 14px;
  color: #4b5563;
  max-width: 560px;
  margin: 0 auto 24px;
  line-height: 1.5;
}

.btn--lg {
  padding: 12px 24px;
  font-size: 15px;
}
</style>
