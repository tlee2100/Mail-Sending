import { apiRequest } from "./http";
import type { AuthSession, Campaign, Paginated } from "../types";

export const campaignsApi = {
  list(session: AuthSession, pageSize = 50) {
    return apiRequest<Paginated<Campaign>>(
      session.baseUrl,
      "/campaigns",
      { token: session.token },
      { pageSize },
    );
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
};
