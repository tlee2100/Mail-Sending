import { apiRequest } from "./http";
import type { AuthSession, Contact, ContactField, ContactTag, Paginated } from "../types";

type ContactBody = {
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
};

export const contactsApi = {
  list(session: AuthSession, query?: { search?: string; pageSize?: number; userId?: number; status?: string; city?: string; tagId?: number }) {
    return apiRequest<Paginated<Contact>>(
      session.baseUrl,
      "/contacts",
      { token: session.token },
      {
        pageSize: query?.pageSize || 50,
        search: query?.search,
        userId: query?.userId,
        status: query?.status,
        city: query?.city,
        tagId: query?.tagId,
      },
    );
  },

  get(session: AuthSession, id: number) {
    return apiRequest<Contact>(session.baseUrl, `/contacts/${id}`, { token: session.token });
  },

  create(session: AuthSession, body: ContactBody) {
    return apiRequest<Contact>(session.baseUrl, "/contacts", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  update(session: AuthSession, id: number, body: Partial<ContactBody>) {
    return apiRequest<Contact>(session.baseUrl, `/contacts/${id}`, {
      method: "PATCH",
      token: session.token,
      body,
    });
  },

  delete(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/contacts/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  },

  listTags(session: AuthSession, query?: { userId?: number }) {
    return apiRequest<ContactTag[]>(session.baseUrl, "/contacts/tags", {
      token: session.token,
    }, query);
  },

  createTag(session: AuthSession, body: { tagName: string; color?: string }) {
    return apiRequest<ContactTag>(session.baseUrl, "/contacts/tags", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  updateTag(session: AuthSession, id: number, body: { tagName?: string; color?: string }) {
    return apiRequest<ContactTag>(session.baseUrl, `/contacts/tags/${id}`, {
      method: "PATCH",
      token: session.token,
      body,
    });
  },

  deleteTag(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/contacts/tags/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  },

  listTagRecipients(session: AuthSession, tagId: number) {
    return apiRequest<{ total?: number; recipients?: Contact[] }>(
      session.baseUrl,
      `/contacts/tags/${tagId}/recipients`,
      { token: session.token },
    );
  },

  replaceContactTags(session: AuthSession, id: number, tagIds: number[]) {
    return apiRequest<ContactTag[]>(session.baseUrl, `/contacts/${id}/tags`, {
      method: "PUT",
      token: session.token,
      body: { tagIds },
    });
  },

  listContactFields(session: AuthSession, id: number) {
    return apiRequest<ContactField[]>(session.baseUrl, `/contacts/${id}/fields`, {
      token: session.token,
    });
  },

  replaceContactFields(session: AuthSession, id: number, values: Array<{ fieldId: number; value: string | number | boolean | null }>) {
    return apiRequest<ContactField[]>(session.baseUrl, `/contacts/${id}/fields`, {
      method: "PUT",
      token: session.token,
      body: { values },
    });
  },
};
