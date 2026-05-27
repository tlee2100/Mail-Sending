import { apiRequest, API_BASE_URL, ApiClientError } from "./http";

export const individualEmailsApi = {
  list(token: string, query?: { page?: number; pageSize?: number }) {
    return apiRequest<{
      items: Array<Record<string, any>>;
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>("/individual-emails", { token }, query);
  },

  get(token: string, id: string | number) {
    return apiRequest<Record<string, any>>(`/individual-emails/${id}`, { token });
  },

  async importRecipients(token: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/individual-emails/import-recipients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      data?: {
        totalRows: number;
        importedCount: number;
        invalidRows: number;
        recipients: string[];
        errors: Array<{ row: number; message: string }>;
      };
      message?: string;
      error?: {
        message?: string;
        details?: unknown;
      };
    };

    if (!response.ok) {
      throw new ApiClientError(
        payload?.error?.message || payload?.message || "Failed to import recipients",
        response.status,
        payload?.error?.details,
      );
    }

    return payload.data || {
      totalRows: 0,
      importedCount: 0,
      invalidRows: 0,
      recipients: [],
      errors: [],
    };
  },

  sendPreview(
    token: string,
    body: {
      previewEmail: string;
      subject: string;
      content: string;
      htmlContent?: string;
      emailAccountId?: number;
    },
  ) {
    return apiRequest<{
      mode: string;
      sentCount: number;
      failedCount: number;
      account: Record<string, unknown>;
      results: Array<Record<string, unknown>>;
    }>("/individual-emails/preview", {
      method: "POST",
      token,
      body,
    });
  },

  send(
    token: string,
    body: {
      recipients: string[];
      subject: string;
      content: string;
      htmlContent?: string;
      emailAccountId?: number;
    },
  ) {
    return apiRequest<{
      mode: string;
      requestedCount: number;
      sentCount: number;
      failedCount: number;
      account: Record<string, unknown>;
      results: Array<Record<string, unknown>>;
    }>("/individual-emails/send", {
      method: "POST",
      token,
      body,
    });
  },
};
