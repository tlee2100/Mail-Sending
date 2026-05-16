import { apiRequest } from "./http";

export const campaignsApi = {
  list(
    token: string,
    query?: { page?: number; pageSize?: number; status?: string },
  ) {
    return apiRequest<{
      items: Array<Record<string, unknown>>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>("/campaigns", { token }, query);
  },

  get(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/campaigns/${id}`, { token });
  },

  recipients(
    token: string,
    id: string | number,
    query?: { page?: number; pageSize?: number; status?: string },
  ) {
    return apiRequest<{
      items: Array<Record<string, unknown>>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>(`/campaigns/${id}/recipients`, { token }, query);
  },

  create(
    token: string,
    body: {
      campaignName: string;
      templateId: number;
      emailAccountId: number;
      segmentId?: number;
      campaignType?: "regular" | "ab_test" | "automated";
      scheduledTime?: string | null;
      contactIds?: number[];
      recipientEmails?: string[];
    },
  ) {
    return apiRequest<Record<string, unknown>>("/campaigns", {
      method: "POST",
      token,
      body,
    });
  },

  update(
    token: string,
    id: string | number,
    body: {
      campaignName?: string;
      templateId?: number;
      emailAccountId?: number;
      segmentId?: number | null;
      campaignType?: "regular" | "ab_test" | "automated";
      scheduledTime?: string | null;
      contactIds?: number[];
      recipientEmails?: string[];
    },
  ) {
    return apiRequest<Record<string, unknown>>(`/campaigns/${id}`, {
      method: "PUT",
      token,
      body,
    });
  },

  importRecipients(token: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<{
      totalRows: number;
      importedCount: number;
      invalidRows: number;
      recipients: string[];
      errors: Array<{ row: number; message: string }>;
    }>("/campaigns/import-recipients", {
      method: "POST",
      token,
      body: formData,
    });
  },

  start(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/campaigns/${id}/start`, {
      method: "POST",
      token,
    });
  },

  pause(token: string, id: string | number) {
    return apiRequest<Record<string, unknown>>(`/campaigns/${id}/pause`, {
      method: "POST",
      token,
    });
  },
};
