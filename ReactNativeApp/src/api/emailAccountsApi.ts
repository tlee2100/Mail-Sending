import { apiRequest } from "./http";
import type { AuthSession, EmailAccount } from "../types";

export const emailAccountsApi = {
  list(session: AuthSession, query?: { userId?: number }) {
    return apiRequest<EmailAccount[]>(session.baseUrl, "/email-accounts", {
      token: session.token,
    }, query);
  },
};
