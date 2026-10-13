import { ref } from "vue";
import { defineStore } from "pinia";
import { contactsApi } from "../api/contactsApi";
import type { Contact, ContactTag, ContactFilterParams } from "../types/contact";
import type { PaginationMeta } from "../types/api";

export const useContactsStore = defineStore("contacts", () => {
  const contacts = ref<Contact[]>([]);
  const tags = ref<ContactTag[]>([]);
  const isLoading = ref(false);
  const isTagsLoading = ref(false);
  const error = ref<string | null>(null);

  const pagination = ref<PaginationMeta>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  async function fetchContacts(params?: ContactFilterParams) {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await contactsApi.listContacts("", params);
      contacts.value = (res.data.items || []) as Contact[];
      if (res.data.pagination) {
        pagination.value = res.data.pagination;
      }
      return contacts.value;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load contacts";
      error.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchTags() {
    isTagsLoading.value = true;
    try {
      const res = await contactsApi.listTags("");
      tags.value = (res.data || []) as ContactTag[];
      return tags.value;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tags";
      error.value = msg;
      throw err;
    } finally {
      isTagsLoading.value = false;
    }
  }

  async function createContact(payload: { email: string; [key: string]: unknown }) {
    const res = await contactsApi.createContact("", payload as any);
    await fetchContacts();
    return res.data;
  }

  async function updateContact(id: number, payload: Record<string, unknown>) {
    const res = await contactsApi.updateContact("", id, payload as any);
    await fetchContacts();
    return res.data;
  }

  async function deleteContact(id: number) {
    await contactsApi.deleteContact("", id);
    contacts.value = contacts.value.filter((c) => c.id !== id);
    pagination.value.total = Math.max(0, pagination.value.total - 1);
  }

  return {
    contacts,
    tags,
    isLoading,
    isTagsLoading,
    error,
    pagination,
    fetchContacts,
    fetchTags,
    createContact,
    updateContact,
    deleteContact,
  };
});
