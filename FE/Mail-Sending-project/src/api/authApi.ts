import { apiRequest } from "./http";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  OtpRequestPayload,
  OtpVerifyPayload,
  ProfileUpdatePayload,
} from "../types/auth";

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type ProfileUpdateResult = (AuthUser | OtpRequestPayload) & {
  requiresOtp?: boolean;
  email?: string;
  debugOtp?: string;
};

export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  register(payload: RegisterPayload) {
    return apiRequest<OtpRequestPayload>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  verifyRegisterOtp(payload: OtpVerifyPayload) {
    return apiRequest<AuthResponse>("/auth/register/verify-otp", {
      method: "POST",
      body: payload,
    });
  },

  me(token?: string) {
    return apiRequest<AuthUser>("/auth/me", {
      token,
    });
  },

  requestPasswordChangeOtp(payload: {
    oldPassword?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const body = {
      oldPassword: payload.oldPassword || payload.currentPassword,
      newPassword: payload.newPassword,
    };
    return apiRequest<OtpRequestPayload>("/auth/password/request-otp", {
      method: "POST",
      body,
    });
  },

  verifyPasswordChangeOtp(payload: { email?: string; otp: string }) {
    return apiRequest<{ updated: boolean }>("/auth/password/verify-otp", {
      method: "POST",
      body: payload,
    });
  },

  requestPasswordResetOtp(payload: string | { email: string }) {
    const email = typeof payload === "string" ? payload : payload.email;
    return apiRequest<OtpRequestPayload>("/auth/password/reset-request-otp", {
      method: "POST",
      body: { email },
    });
  },

  verifyPasswordResetOtp(payload: { email: string; otp: string; newPassword?: string }) {
    return apiRequest<{ updated: boolean }>("/auth/password/reset-verify-otp", {
      method: "POST",
      body: payload,
    });
  },

  updateProfile(payload: ProfileUpdatePayload) {
    return apiRequest<ProfileUpdateResult>("/auth/profile", {
      method: "PATCH",
      body: payload,
    });
  },

  verifyProfileEmailOtp(payload: string | { email?: string; otp: string }) {
    const otp = typeof payload === "string" ? payload : payload.otp;
    return apiRequest<AuthUser>("/auth/profile/verify-email-otp", {
      method: "POST",
      body: { otp },
    });
  },
};
