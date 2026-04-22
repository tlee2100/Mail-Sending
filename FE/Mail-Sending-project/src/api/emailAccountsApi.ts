import { apiRequest } from "./http";

export const emailAccountsApi = {
  list(token: string) {
    return apiRequest<Array<Record<string, unknown>>>("/email-accounts", { token });
  },

  create(
    token: string,
    body: {
      emailAddress: string;
      displayName?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUsername?: string;
      smtpPassword?: string;
      useTls?: boolean;
      isDefault?: boolean;
      status?: string;
      dailyLimit?: number;
    },
  ) {
    return apiRequest<Record<string, unknown>>("/email-accounts", {
      method: "POST",
      token,
      body,
    });
  },

  update(
    token: string,
    id: string | number,
    body: {
      emailAddress?: string;
      displayName?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUsername?: string;
      smtpPassword?: string;
      useTls?: boolean;
      isDefault?: boolean;
      status?: string;
      dailyLimit?: number;
    },
  ) {
    return apiRequest<Record<string, unknown>>(`/email-accounts/${id}`, {
      method: "PATCH",
      token,
      body,
    });
  },

  setDefault(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/email-accounts/${id}/default`, {
      method: "POST",
      token,
    });
  },

  testConnection(
    token: string,
    body: {
      accountId?: number;
      emailAddress?: string;
      displayName?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUsername?: string;
      smtpPassword?: string;
      useTls?: boolean;
    },
  ) {
    return apiRequest<Record<string, unknown>>("/email-accounts/test", {
      method: "POST",
      token,
      body,
    });
  },
};
