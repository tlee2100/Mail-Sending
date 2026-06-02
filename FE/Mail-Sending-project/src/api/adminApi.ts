import { apiRequest } from "./http";

export type AdminUserRow = {
  id: number;
  name?: string | null;
  email?: string | null;
  role?: "admin" | "user" | string | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
  created_at?: string | null;
  last_login_at?: string | null;
  [key: string]: unknown;
};

export type AdminUsersResponse =
  | AdminUserRow[]
  | {
      items?: AdminUserRow[];
      users?: AdminUserRow[];
      pagination?: Record<string, unknown>;
    };

export const adminApi = {
  listUsers(token: string) {
    return apiRequest<AdminUsersResponse>("/admin/users", { token });
  },

  getUser(token: string, id: string | number) {
    return apiRequest<AdminUserRow>(`/admin/users/${id}`, { token });
  },

  updateUserRole(token: string, id: string | number, role: "admin" | "user") {
    return apiRequest<AdminUserRow>(`/admin/users/${id}/role`, {
      method: "PATCH",
      token,
      body: { role },
    });
  },

  updateUserStatus(token: string, id: string | number, isActive: boolean) {
    return apiRequest<AdminUserRow>(`/admin/users/${id}/status`, {
      method: "PATCH",
      token,
      body: { isActive },
    });
  },

  deleteTemplate(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/admin/templates/${id}`, {
      method: "DELETE",
      token,
    });
  },

  pauseCampaign(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/admin/campaigns/${id}/pause`, {
      method: "POST",
      token,
    });
  },

  resumeCampaign(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/admin/campaigns/${id}/resume`, {
      method: "POST",
      token,
    });
  },

  deleteCampaign(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/admin/campaigns/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
