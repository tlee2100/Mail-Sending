import { apiDownload, apiRequest } from "./http";

export const contactsApi = {
  listContacts(
    token: string,
    query?: { page?: number; pageSize?: number; search?: string; status?: string; city?: string },
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
    query?: { format?: "csv" | "xlsx"; search?: string; status?: string; city?: string },
  ) {
    return apiDownload("/contacts/export", { token }, query);
  },
};
