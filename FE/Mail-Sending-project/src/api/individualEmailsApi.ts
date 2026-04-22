import { apiRequest } from "./http";

export const individualEmailsApi = {
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
