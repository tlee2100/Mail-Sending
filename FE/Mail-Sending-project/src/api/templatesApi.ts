import { apiRequest } from "./http";

type TemplateListQuery = {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  userId?: number;
};

type TemplateListResponse = {
  items: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export const templatesApi = {
  listTemplates(token: string, query?: TemplateListQuery) {
    return apiRequest<TemplateListResponse>("/templates", { token }, query);
  },

  listSharedTemplates(token: string, query?: TemplateListQuery) {
    return apiRequest<TemplateListResponse>("/templates/shared", { token }, query);
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

  getTemplate(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/templates/${id}`, { token });
  },

  updateTemplate(
    token: string,
    id: string | number,
    body: {
      templateName?: string;
      subject?: string;
      previewText?: string;
      contentHtml?: string;
      contentText?: string;
      isActive?: boolean;
    },
  ) {
    return apiRequest<Record<string, unknown>>(`/templates/${id}`, {
      method: "PATCH",
      token,
      body,
    });
  },

  deleteTemplate(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/templates/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
