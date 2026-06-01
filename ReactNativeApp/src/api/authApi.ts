import { apiRequest } from "./http";
import type { AuthPayload } from "../types";

type OtpRequestPayload = {
  email: string;
  expiresInMinutes: number;
  requiresOtp: boolean;
};

export const authApi = {
  login(baseUrl: string, body: { email: string; password: string }) {
    return apiRequest<AuthPayload>(baseUrl, "/auth/login", {
      method: "POST",
      body,
    });
  },

  register(baseUrl: string, body: { name: string; email: string; password: string; role: string }) {
    return apiRequest<OtpRequestPayload>(baseUrl, "/auth/register", {
      method: "POST",
      body,
    });
  },

  verifyRegisterOtp(baseUrl: string, body: { email: string; otp: string }) {
    return apiRequest<AuthPayload>(baseUrl, "/auth/register/verify-otp", {
      method: "POST",
      body,
    });
  },
};
