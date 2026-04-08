import { apiRequest } from "./http";

export const templatesApi = {
  listTemplates(
    token: string,
    query?: { page?: number; pageSize?: number; isActive?: boolean },
  ) {
    return apiRequest<{
      items: Array<Record<string, unknown>>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>("/templates", { token }, query);
  },

  createTemplate(
    token: string,
    body: {
      templateName: string;
      subject?: string;
      previewText?: string;
      contentHtml?: string;
      contentText?: string;
      isActive?: boolean;
    },
  ) {
    return apiRequest<Record<string, unknown>>("/templates", {
      method: "POST",
      token,
      body,
    });
  },
};
