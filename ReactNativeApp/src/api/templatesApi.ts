import { apiRequest } from "./http";
import type { AuthSession, EmailTemplate, Paginated } from "../types";

export const templatesApi = {
  listActive(session: AuthSession) {
    return apiRequest<Paginated<EmailTemplate>>(
      session.baseUrl,
      "/templates",
      { token: session.token },
      { pageSize: 100, isActive: true },
    );
  },

  get(session: AuthSession, id: number) {
    return apiRequest<EmailTemplate>(session.baseUrl, `/templates/${id}`, {
      token: session.token,
    });
  },
};
