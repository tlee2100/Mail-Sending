import { apiRequest } from "./http";
import type { AuthSession, EmailAccount } from "../types";

export const emailAccountsApi = {
  list(session: AuthSession) {
    return apiRequest<EmailAccount[]>(session.baseUrl, "/email-accounts", {
      token: session.token,
    });
  },
};
