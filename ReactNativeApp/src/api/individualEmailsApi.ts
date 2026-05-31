import { apiRequest } from "./http";
import type { AuthSession, SendEmailResult } from "../types";

type BaseEmailBody = {
  subject: string;
  content: string;
  htmlContent?: string;
  emailAccountId?: number;
};

export const individualEmailsApi = {
  preview(session: AuthSession, body: BaseEmailBody & { previewEmail: string }) {
    return apiRequest<SendEmailResult>(session.baseUrl, "/individual-emails/preview", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  send(session: AuthSession, body: BaseEmailBody & { recipients: string[] }) {
    return apiRequest<SendEmailResult>(session.baseUrl, "/individual-emails/send", {
      method: "POST",
      token: session.token,
      body,
    });
  },
};
