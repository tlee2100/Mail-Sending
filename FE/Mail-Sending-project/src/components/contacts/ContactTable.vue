<template>
  <div class="card card--table">
    <div class="card__header">
      <h3 class="card__title">Contacts ({{ pagination.total }})</h3>
      <button type="button" class="btn btn--secondary btn--sm" @click="emit('refresh')">
        Refresh
      </button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th v-if="isAdmin">Owner</th>
          <th>Tags</th>
          <th>Company</th>
          <th>City</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contact in contacts" :key="contact.id">
          <td>{{ fullName(contact) }}</td>
          <td data-label="Email">{{ contact.email }}</td>
          <td data-label="Status">{{ contact.email_status || "active" }}</td>
          <td v-if="isAdmin" data-label="Owner">{{ ownerText(contact) || "-" }}</td>
          <td data-label="Tags">
            <div class="tag-stack" v-if="contact.tags?.length">
              <span
                v-for="tag in contact.tags"
                :key="tag.id"
                class="contact-tag"
                :style="{ backgroundColor: `${tag.color}20`, color: tag.color }"
              >
                {{ tag.tag_name }}
              </span>
            </div>
            <span v-else class="muted">No tags</span>
          </td>
          <td data-label="Company">{{ contact.company || "-" }}</td>
          <td data-label="City">{{ contact.city || "-" }}</td>
          <td>
            <div class="table-actions">
              <button
                type="button"
                class="btn btn--secondary btn--sm"
                :disabled="!canManageContact(contact)"
                :title="manageBlockedTitle(contact)"
                @click="emit('edit', contact)"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn--secondary btn--sm"
                :disabled="!canManageContact(contact)"
                :title="manageBlockedTitle(contact)"
                @click="emit('manage-tags', contact)"
              >
                Tags
              </button>
              <RouterLink
                v-if="canManageContact(contact)"
                :to="`/contacts/${contact.id}/fields`"
                class="btn btn--secondary btn--sm"
              >
                Fields
              </RouterLink>
              <button v-else type="button" class="btn btn--secondary btn--sm" disabled>
                Fields
              </button>
              <button
                type="button"
                class="btn btn--danger btn--sm"
                :disabled="!canManageContact(contact)"
                :title="manageBlockedTitle(contact)"
                @click="emit('delete', contact)"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <PaginationControls
      :page="pagination.page"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      :totalPages="pagination.totalPages"
      @change="emit('page-change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import PaginationControls from "../common/PaginationControls.vue";

export type ContactItem = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  country?: string | null;
  email_status?: string | null;
  source?: string | null;
  tags?: Array<{ id: number; tag_name: string; color: string; [key: string]: any }>;
  [key: string]: any;
};

defineProps<{
  contacts: ContactItem[];
  isAdmin: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  fullName: (c: any) => string;
  ownerText: (c: any) => string;
  canManageContact: (c: any) => boolean;
  manageBlockedTitle: (c: any) => string;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "edit", contact: any): void;
  (e: "manage-tags", contact: any): void;
  (e: "delete", contact: any): void;
  (e: "page-change", page: number): void;
}>();
</script>

<style scoped>
.tag-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.contact-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.table-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.muted {
  color: var(--color-text-muted, #94a3b8);
  font-size: 12px;
}
</style>
