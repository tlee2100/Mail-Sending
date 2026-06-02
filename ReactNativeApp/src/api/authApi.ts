import { apiRequest } from "./http";
import type { AuthPayload, AuthUser } from "../types";

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

  register(baseUrl: string, body: { name: string; email: string; password: string }) {
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

  requestPasswordResetOtp(baseUrl: string, body: { email: string }) {
    return apiRequest<OtpRequestPayload>(baseUrl, "/auth/password/forgot/request-otp", {
      method: "POST",
      body,
    });
  },

  verifyPasswordResetOtp(baseUrl: string, body: { email: string; otp: string; newPassword: string }) {
    return apiRequest<{ email: string }>(baseUrl, "/auth/password/forgot/verify-otp", {
      method: "POST",
      body,
    });
  },

  requestPasswordChangeOtp(
    session: { baseUrl: string; token: string },
    body: { currentPassword: string; newPassword: string },
  ) {
    return apiRequest<OtpRequestPayload>(session.baseUrl, "/auth/password/request-otp", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  verifyPasswordChangeOtp(session: { baseUrl: string; token: string }, body: { otp: string }) {
    return apiRequest<{ email: string }>(session.baseUrl, "/auth/password/verify-otp", {
      method: "POST",
      token: session.token,
      body,
    });
  },

  me(session: { baseUrl: string; token: string }) {
    return apiRequest<AuthUser>(session.baseUrl, "/auth/me", {
      token: session.token,
    });
  },

  updateProfile(session: { baseUrl: string; token: string }, body: { name: string; email?: string }) {
    return apiRequest<{ requiresOtp?: boolean; email?: string; expiresInMinutes?: number; user?: AuthUser }>(
      session.baseUrl,
      "/auth/profile",
      {
        method: "PATCH",
        token: session.token,
        body,
      },
    );
  },

  verifyProfileEmailOtp(session: { baseUrl: string; token: string }, body: { email: string; otp: string }) {
    return apiRequest<{ requiresOtp?: boolean; user?: AuthUser }>(
      session.baseUrl,
      "/auth/profile/verify-email-otp",
      {
        method: "POST",
        token: session.token,
        body,
      },
    );
  },
};
