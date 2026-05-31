import { apiRequest } from "./http";
import type { AuthPayload } from "../types";

export const authApi = {
  login(baseUrl: string, body: { email: string; password: string }) {
    return apiRequest<AuthPayload>(baseUrl, "/auth/login", {
      method: "POST",
      body,
    });
  },

  register(baseUrl: string, body: { name: string; email: string; password: string; role: string }) {
    return apiRequest<AuthPayload>(baseUrl, "/auth/register", {
      method: "POST",
      body,
    });
  },
};
