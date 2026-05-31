import { apiRequest } from "./http";
import type { AuthSession, Contact, ContactTag, Paginated } from "../types";

export const contactsApi = {
  list(session: AuthSession, query?: { search?: string; pageSize?: number }) {
    return apiRequest<Paginated<Contact>>(
      session.baseUrl,
      "/contacts",
      { token: session.token },
      { pageSize: query?.pageSize || 50, search: query?.search },
    );
  },

  listTags(session: AuthSession) {
    return apiRequest<ContactTag[]>(session.baseUrl, "/contacts/tags", {
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
};
