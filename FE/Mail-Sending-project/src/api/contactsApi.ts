import { apiDownload, apiRequest } from "./http";

export const contactsApi = {
  listContacts(
    token: string,
    query?: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      city?: string;
      tagId?: number;
      userId?: number;
    },
  ) {
    return apiRequest<{
      items: Array<Record<string, unknown>>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>("/contacts", { token }, query);
  },

  getContact(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/contacts/${id}`, { token });
  },

  createContact(
    token: string,
    body: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
      city?: string;
      country?: string;
      language?: string;
      emailStatus?: string;
      source?: string;
    },
  ) {
    return apiRequest<Record<string, unknown>>("/contacts", {
      method: "POST",
      token,
      body,
    });
  },

  updateContact(
    token: string,
    id: string | number,
    body: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
      city?: string;
      country?: string;
      language?: string;
      emailStatus?: string;
      source?: string;
    },
  ) {
    return apiRequest<Record<string, unknown>>(`/contacts/${id}`, {
      method: "PATCH",
      token,
      body,
    });
  },

  deleteContact(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/contacts/${id}`, {
      method: "DELETE",
      token,
    });
  },

  listTags(token: string) {
    return apiRequest<Array<Record<string, unknown>>>("/contacts/tags", { token });
  },

  createTag(token: string, body: { tagName: string; color?: string }) {
    return apiRequest<Record<string, unknown>>("/contacts/tags", {
      method: "POST",
      token,
      body,
    });
  },

  updateTag(
    token: string,
    id: string | number,
    body: { tagName?: string; color?: string },
  ) {
    return apiRequest<Record<string, unknown>>(`/contacts/tags/${id}`, {
      method: "PATCH",
      token,
      body,
    });
  },

  deleteTag(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/contacts/tags/${id}`, {
      method: "DELETE",
      token,
    });
  },

  listTagRecipients(token: string, tagId: string | number) {
    return apiRequest<{
      tagId: number;
      total: number;
      recipients: Array<Record<string, unknown>>;
    }>(`/contacts/tags/${tagId}/recipients`, { token });
  },

  replaceContactTags(token: string, id: string | number, tagIds: number[]) {
    return apiRequest<Array<Record<string, unknown>>>(`/contacts/${id}/tags`, {
      method: "PUT",
      token,
      body: { tagIds },
    });
  },

  listFields(token: string) {
    return apiRequest<Array<Record<string, unknown>>>("/contacts/fields", { token });
  },

  createField(
    token: string,
    body: {
      fieldName: string;
      fieldLabel?: string;
      fieldType?: "text" | "number" | "date" | "boolean" | "url";
      isRequired?: boolean;
    },
  ) {
    return apiRequest<Record<string, unknown>>("/contacts/fields", {
      method: "POST",
      token,
      body,
    });
  },

  updateField(
    token: string,
    id: string | number,
    body: {
      fieldName?: string;
      fieldLabel?: string;
      fieldType?: "text" | "number" | "date" | "boolean" | "url";
      isRequired?: boolean;
    },
  ) {
    return apiRequest<Record<string, unknown>>(`/contacts/fields/${id}`, {
      method: "PATCH",
      token,
      body,
    });
  },

  deleteField(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/contacts/fields/${id}`, {
      method: "DELETE",
      token,
    });
  },

  listContactFields(token: string, id: string | number) {
    return apiRequest<Array<Record<string, unknown>>>(`/contacts/${id}/fields`, {
      token,
    });
  },

  replaceContactFields(
    token: string,
    id: string | number,
    values: Array<{ fieldId: number; value: string | number | boolean | null }>,
  ) {
    return apiRequest<Array<Record<string, unknown>>>(`/contacts/${id}/fields`, {
      method: "PUT",
      token,
      body: { values },
    });
  },

  importContacts(token: string, file: File, mode: "insert" | "upsert") {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<Record<string, unknown>>(
      "/contacts/import",
      {
        method: "POST",
        token,
        body: formData,
      },
      { mode },
    );
  },

  exportContacts(
    token: string,
    query?: {
      format?: "csv" | "xlsx";
      search?: string;
      status?: string;
      city?: string;
      tagId?: number;
      userId?: number;
    },
  ) {
    return apiDownload("/contacts/export", { token }, query);
  },
};
