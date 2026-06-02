import { apiRequest } from "./http";
import type { AuthSession, EmailTemplate, Paginated, TemplateDesignerDraft, TemplateLayout } from "../types";

type TemplateBody = {
  templateName: string;
  subject?: string;
  previewText?: string;
  contentHtml?: string;
  contentText?: string;
  isActive?: boolean;
};

export const templatesApi = {
  list(session: AuthSession, query: { pageSize?: number; isActive?: boolean } = {}) {
    return apiRequest<Paginated<EmailTemplate>>(
      session.baseUrl,
      "/templates",
      { token: session.token },
      { pageSize: query.pageSize || 100, isActive: query.isActive },
    );
  },

  listActive(session: AuthSession) {
    return apiRequest<Paginated<EmailTemplate>>(
      session.baseUrl,
      "/templates",
      { token: session.token },
      { pageSize: 100, isActive: true },
    );
  },

  listShared(session: AuthSession, query: { pageSize?: number; isActive?: boolean } = {}) {
    return apiRequest<Paginated<EmailTemplate>>(
      session.baseUrl,
      "/templates/shared",
      { token: session.token },
      { pageSize: query.pageSize || 100, isActive: query.isActive },
    );
  },

  get(session: AuthSession, id: number) {
    return apiRequest<EmailTemplate>(session.baseUrl, `/templates/${id}`, {
      token: session.token,
    });
  },

  create(session: AuthSession, body: TemplateBody) {
    return apiRequest<EmailTemplate>(session.baseUrl, "/templates", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  update(session: AuthSession, id: number, body: Partial<TemplateBody>) {
    return apiRequest<EmailTemplate>(session.baseUrl, `/templates/${id}`, {
      method: "PATCH",
      token: session.token,
      body,
    });
  },

  delete(session: AuthSession, id: number) {
    return apiRequest<{ deleted?: boolean }>(session.baseUrl, `/templates/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  },

  getDesigner(session: AuthSession, id: number) {
    return apiRequest<TemplateDesignerDraft>(session.baseUrl, `/templates/${id}/designer`, {
      token: session.token,
    });
  },

  saveDesigner(
    session: AuthSession,
    id: number,
    body: { layout: TemplateLayout; renderedHtml?: string; renderedText?: string; note?: string },
  ) {
    return apiRequest<TemplateDesignerDraft>(session.baseUrl, `/templates/${id}/designer`, {
      method: "PUT",
      token: session.token,
      body,
    });
  },

  publishDesigner(
    session: AuthSession,
    id: number,
    body: { layout: TemplateLayout; renderedHtml?: string; renderedText?: string; note?: string },
  ) {
    return apiRequest<TemplateDesignerDraft>(session.baseUrl, `/templates/${id}/designer/publish`, {
      method: "POST",
      token: session.token,
      body,
    });
  },
};
