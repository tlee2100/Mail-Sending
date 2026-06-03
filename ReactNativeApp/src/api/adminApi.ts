import { apiRequest } from "./http";
import type { AuthSession } from "../types";

export type AdminUserRow = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: "admin" | "user" | string | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
  created_at?: string | null;
  last_login_at?: string | null;
};

type AdminUsersResponse =
  | AdminUserRow[]
  | {
      items?: AdminUserRow[];
      users?: AdminUserRow[];
    };

function unwrapUsers(data: AdminUsersResponse) {
  if (Array.isArray(data)) return data;
  return data.items || data.users || [];
}

export const adminApi = {
  async listUsers(session: AuthSession, query?: { role?: string; isActive?: boolean }) {
    const data = await apiRequest<AdminUsersResponse>(
      session.baseUrl,
      "/admin/users",
      { token: session.token },
      query,
    );
    return unwrapUsers(data);
  },

  updateUserRole(session: AuthSession, id: number, role: "admin" | "user") {
    return apiRequest<AdminUserRow>(session.baseUrl, `/admin/users/${id}/role`, {
      method: "PATCH",
      token: session.token,
      body: { role },
    });
  },

  updateUserStatus(session: AuthSession, id: number, isActive: boolean) {
    return apiRequest<AdminUserRow>(session.baseUrl, `/admin/users/${id}/status`, {
      method: "PATCH",
      token: session.token,
      body: { isActive },
    });
  },

  deleteTemplate(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/admin/templates/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  },

  pauseCampaign(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/admin/campaigns/${id}/pause`, {
      method: "POST",
      token: session.token,
      body: {},
    });
  },

  resumeCampaign(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/admin/campaigns/${id}/resume`, {
      method: "POST",
      token: session.token,
      body: {},
    });
  },

  deleteCampaign(session: AuthSession, id: number) {
    return apiRequest<Record<string, unknown>>(session.baseUrl, `/admin/campaigns/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  },
};
