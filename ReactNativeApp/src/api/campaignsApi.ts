import { apiRequest } from "./http";
import type { AuthSession, Campaign, CampaignRecipient, Paginated } from "../types";

type CampaignBody = {
  campaignName: string;
  templateId: number;
  emailAccountId: number;
  campaignType?: "regular" | "ab_test" | "automated";
  scheduledTime?: string | null;
  recipientEmails?: string[];
};

export const campaignsApi = {
  list(session: AuthSession, pageSizeOrQuery: number | { pageSize?: number; userId?: number; status?: string } = 50) {
    const query = typeof pageSizeOrQuery === "number" ? { pageSize: pageSizeOrQuery } : pageSizeOrQuery;
    return apiRequest<Paginated<Campaign>>(
      session.baseUrl,
      "/campaigns",
      { token: session.token },
      { pageSize: query.pageSize || 50, userId: query.userId, status: query.status },
    );
  },

  get(session: AuthSession, id: number) {
    return apiRequest<Campaign>(session.baseUrl, `/campaigns/${id}`, {
      token: session.token,
    });
  },

  create(session: AuthSession, body: CampaignBody) {
    return apiRequest<Campaign>(session.baseUrl, "/campaigns", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  update(session: AuthSession, id: number, body: Partial<CampaignBody>) {
    return apiRequest<Campaign>(session.baseUrl, `/campaigns/${id}`, {
      method: "PUT",
      token: session.token,
      body,
    });
  },

  delete(session: AuthSession, id: number) {
    return apiRequest<{ deleted: boolean }>(session.baseUrl, `/campaigns/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  },

  recipients(session: AuthSession, id: number, pageSize = 100) {
    return apiRequest<Paginated<CampaignRecipient>>(
      session.baseUrl,
      `/campaigns/${id}/recipients`,
      { token: session.token },
      { pageSize },
    );
  },

  addRecipient(session: AuthSession, id: number, email: string) {
    return apiRequest<CampaignRecipient>(session.baseUrl, `/campaigns/${id}/recipients`, {
      method: "POST",
      token: session.token,
      body: { email },
    });
  },

  updateRecipient(session: AuthSession, id: number, recipientId: number, email: string) {
    return apiRequest<CampaignRecipient>(session.baseUrl, `/campaigns/${id}/recipients/${recipientId}`, {
      method: "PATCH",
      token: session.token,
      body: { email },
    });
  },

  deleteRecipient(session: AuthSession, id: number, recipientId: number) {
    return apiRequest<{ deleted: boolean }>(session.baseUrl, `/campaigns/${id}/recipients/${recipientId}`, {
      method: "DELETE",
      token: session.token,
    });
  },

  start(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/campaigns/${id}/start`, {
      method: "POST",
      token: session.token,
      body: {},
    });
  },

  pause(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/campaigns/${id}/pause`, {
      method: "POST",
      token: session.token,
      body: {},
    });
  },

  resume(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/campaigns/${id}/resume`, {
      method: "POST",
      token: session.token,
      body: {},
    });
  },
};
